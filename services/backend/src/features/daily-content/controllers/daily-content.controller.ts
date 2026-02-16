// Add import at the top
import { v4 as uuidv4 } from 'uuid';


import type { Request, Response, NextFunction } from 'express';
import { eq, and, gte, lte, desc, asc, ne, sql, inArray } from 'drizzle-orm';

import { db } from '../../../db/index.js';
import {
    examPapers,
    passages,
    questions,
    articles,
    practiceSessions,
    questionAttempts,
    userProfiles
} from '../../../db/schema.js';
import { ApiError, Errors, successResponse } from '../../../common/utils/errors.js';
import { createChildLogger } from '../../../common/utils/logger.js';
import { parseCorrectAnswer } from '../../../common/utils/parseCorrectAnswer.js';

const logger = createChildLogger('daily-content-controller');
import type {
    TestDataResponse,
    LeaderboardResponse,
    SessionWithAttemptsResponse,
    DailyContentGenerationResponse,
} from '../types/daily-content.types.js';
import { analyticsService } from '../../analytics/analytics.service.js';
import { AdminActivityService } from '../../admin/services/admin-activity.service.js';
import { TimeService } from '../../../common/utils/time.js';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate leaderboard from sessions
 */
function calculateLeaderboard(
    sessions: any[],
    profiles: any[]
): Map<string, any> {
    const leaderboardMap = new Map();
    const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

    // Group sessions by user
    const userSessions = new Map<string, any[]>();
    sessions.forEach(session => {
        if (!userSessions.has(session.user_id)) {
            userSessions.set(session.user_id, []);
        }
        userSessions.get(session.user_id)!.push(session);
    });

    // Calculate metrics for each user
    userSessions.forEach((userSessionList, userId) => {
        const profile = profileMap.get(userId);
        if (!profile) return;

        // Aggregate metrics across all sessions for this exam
        let totalQuestions = 0;
        let totalCorrect = 0;
        let totalTime = 0;

        userSessionList.forEach(session => {
            totalQuestions += session.total_questions || 0;
            totalCorrect += session.correct_answers || 0;
            totalTime += session.time_spent_seconds || 0;
        });

        const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        const avgTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;

        // Calculate composite score
        // Score = (Accuracy * 0.6) + (Speed Bonus * 0.4)
        const speedBonus = Math.max(0, Math.min(100, 100 - (avgTimePerQuestion - 30) * 2));
        const score = (accuracy * 0.6) + (speedBonus * 0.4);

        leaderboardMap.set(userId, {
            rank: 0, // Will be assigned later
            user_id: userId,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            score: Math.round(score * 100) / 100,
            accuracy: Math.round(accuracy * 100) / 100,
            time_taken_seconds: totalTime,
            questions_attempted: totalQuestions,
            avg_time_per_question: Math.round(avgTimePerQuestion * 100) / 100,
        });
    });

    return leaderboardMap;
}

// =============================================================================
// Fetch Today's Daily Test Data
// =============================================================================
export async function fetchDailyTestData(req: Request, res: Response, next: NextFunction): Promise<void> {
    logger.info('fetchDailyTestData called');

    try {
        // Get today's date range in IST
        const startOfToday = TimeService.startOfTodayIST();
        const endOfToday = TimeService.endOfTodayIST();

        logger.info({ startOfToday, endOfToday }, 'Fetching exam for date (IST)');

        // Fetch today's daily practice exam
        const examInfo = await db.query.examPapers.findFirst({
            where: and(
                eq(examPapers.year, 2026),
                eq(examPapers.name, 'Daily Practice'),
                eq(examPapers.generation_status, 'completed'),
                gte(examPapers.created_at, startOfToday),
                lte(examPapers.created_at, endOfToday)
            ),
            orderBy: [desc(examPapers.created_at)],
        });

        // Check if there's an exam for today
        if (!examInfo) {
            logger.info('No exam found for today');
            res.json(successResponse({
                examInfo: null,
                passages: [],
                questions: [],
            } as TestDataResponse));
            return;
        }

        logger.info({ examId: examInfo.id }, 'Fetched exam info');

        // For /today endpoint, only return exam info (not passages/questions)
        // Child pages (RC/VA) will fetch full content via /:exam_id when needed
        const response = {
            examInfo: examInfo, // Contains id, used_articles_id, etc.
        };

        res.json(successResponse(response));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in fetchDailyTestData');
        if (error instanceof ApiError) return next(error);
        next(Errors.internalError());
    }
}

// =============================================================================
// Fetch Previous Daily Tests (with pagination)
// =============================================================================
export async function fetchPreviousDailyTests(req: Request, res: Response, next: NextFunction): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    logger.info({ page, limit }, 'fetchPreviousDailyTests called');

    try {
        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Fetch previous daily practice exams
        const examInfo = await db.query.examPapers.findMany({
            where: and(
                eq(examPapers.year, 2026),
                eq(examPapers.name, 'Daily Practice'),
                eq(examPapers.generation_status, 'completed')
            ),
            orderBy: [desc(examPapers.created_at)],
            limit,
            offset,
        });

        // Already in snake_case
        const examInfoMapped = examInfo;

        logger.info({ count: examInfo.length, page }, 'Fetched previous exams');

        res.json(successResponse(examInfoMapped));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in fetchPreviousDailyTests');
        if (error instanceof ApiError) return next(error);
        next(Errors.internalError());
    }
}

// =============================================================================
// Fetch Daily Test By ID
// =============================================================================
export async function fetchDailyTestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    const exam_id = req.params.exam_id as string;

    logger.info({ exam_id }, 'fetchDailyTestById called');

    try {
        // Fetch the specific exam
        const examInfo = await db.select().from(examPapers).where(eq(examPapers.id, exam_id)).limit(1);

        if (!examInfo || examInfo.length === 0) {
            throw Errors.notFound('Exam not found');
        }

        const exam = examInfo[0];
        logger.info({ examId: exam.id }, 'Fetched exam info');


        // Mapping passages
        const passageData = await db.query.passages.findMany({
            where: eq(passages.paper_id, exam.id),
        });
        const passageDataMapped = passageData.map(p => ({
            id: p.id,
            title: p.title,
            content: p.content,
            word_count: p.word_count,
            genre: p.genre,
            difficulty: p.difficulty,
            source: p.source,
            paper_id: p.paper_id,
            is_daily_pick: p.is_daily_pick ?? false,
            is_featured: p.is_featured ?? false,
            is_archived: p.is_archived ?? false,
            created_at: p.created_at,
            updated_at: p.updated_at,
        }));

        logger.info({ count: passageData.length }, 'Fetched passages');

        // Fetch questions
        const questionData = await db.query.questions.findMany({
            where: eq(questions.paper_id, exam.id),
            orderBy: [asc(questions.created_at), asc(questions.id)],
        });

        const include_solutions = req.query.include_solutions === 'true';

        // Mapping questions
        const questionDataMapped = questionData.map(q => {

            return {
                id: q.id,
                passage_id: q.passage_id,
                paper_id: q.paper_id,
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options,
                jumbled_sentences: q.jumbled_sentences,
                correct_answer: include_solutions ? parseCorrectAnswer(q.correct_answer) : null,
                rationale: q.rationale,
                difficulty: q.difficulty,
                tags: q.tags,
                created_at: q.created_at,
                updated_at: q.updated_at,
            };
        });

        logger.info({ count: questionData.length, include_solutions }, 'Fetched questions');

        const response = {
            examInfo: exam, // already snake_case
            passages: passageDataMapped as any,
            questions: questionDataMapped as any,
        };

        res.json(successResponse(response));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in fetchDailyTestById');
        if (error instanceof ApiError) return next(error);
        next(Errors.internalError());
    }
}

// =============================================================================
// Fetch Daily Test Details By ID (Public - No Content)
// =============================================================================
export async function fetchDailyTestDetailsById(req: Request, res: Response, next: NextFunction): Promise<void> {
    const exam_id = req.params.exam_id as string;

    logger.info({ exam_id }, 'fetchDailyTestDetailsById called');

    try {
        // Fetch the specific exam
        const examInfo = await db.select().from(examPapers).where(eq(examPapers.id, exam_id)).limit(1);

        if (!examInfo || examInfo.length === 0) {
            throw Errors.notFound('Exam not found');
        }

        const exam = examInfo[0];
        logger.info({ examId: exam.id }, 'Fetched exam info');

        const response = {
            examInfo: exam, // already snake_case
        };

        res.json(successResponse(response));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in fetchDailyTestDetailsById');
        if (error instanceof ApiError) return next(error);
        next(Errors.internalError());
    }
}

// =============================================================================
// Start Daily RC Session
// =============================================================================
export async function startDailyRCSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { user_id, paper_id, passage_ids, question_ids } = req.body;

    logger.info({ user_id }, 'startDailyRCSession called');

    try {
        // Verify user is authenticated
        if (!req.user || req.user.userId !== user_id) {
            throw Errors.unauthorized();
        }

        // Create session
        const [session] = await db.insert(practiceSessions).values({
            id: uuidv4(),
            user_id: user_id,
            paper_id: paper_id,
            session_type: 'daily_challenge_rc',
            mode: 'test',
            passage_ids: passage_ids || [],
            question_ids: question_ids || [],
            status: 'in_progress',
            time_spent_seconds: 0,
            pause_duration_seconds: 0,
            total_questions: question_ids?.length || 0,
            correct_answers: 0,
            current_question_index: 0,
            is_group_session: false,
            points_earned: 0,
            is_analysed: false,
            created_at: new Date(),
            updated_at: new Date(),
        }).returning();

        logger.info({ sessionId: session.id }, 'RC session created');
        res.json(successResponse(session));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in startDailyRCSession');
        if (error instanceof ApiError) return next(error);
        next(Errors.internalError());
    }
}

// =============================================================================
// Start Daily VA Session
// =============================================================================
export async function startDailyVASession(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { user_id, paper_id, passage_ids, question_ids } = req.body;

    logger.info({ user_id }, 'startDailyVASession called');

    try {
        // Verify user is authenticated
        if (!req.user || req.user.userId !== user_id) {
            throw Errors.unauthorized();
        }

        // Create session
        const [session] = await db.insert(practiceSessions).values({
            id: uuidv4(),
            user_id: user_id,
            paper_id: paper_id,
            session_type: 'daily_challenge_va',
            mode: 'test',
            passage_ids: passage_ids || [],
            question_ids: question_ids || [],
            status: 'in_progress',
            time_spent_seconds: 0,
            pause_duration_seconds: 0,
            total_questions: question_ids?.length || 0,
            correct_answers: 0,
            current_question_index: 0,
            is_group_session: false,
            points_earned: 0,
            is_analysed: false,
            created_at: new Date(),
            updated_at: new Date(),
        }).returning();

        logger.info({ sessionId: session.id }, 'VA session created');
        res.json(successResponse(session));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in startDailyVASession');
        if (error instanceof ApiError) return next(error);
        next(Errors.internalError());
    }
}

// =============================================================================
// Fetch Existing Session Details
// =============================================================================
export async function fetchExistingSessionDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { user_id, paper_id, session_type } = req.query;

    logger.info({ session_type }, 'fetchExistingSessionDetails called');

    try {
        // Verify user is authenticated
        if (!req.user || req.user.userId !== user_id) {
            throw Errors.unauthorized();
        }

        // Fetch the most recent session
        const session = await db.query.practiceSessions.findFirst({
            where: and(
                eq(practiceSessions.user_id, user_id as string),
                eq(practiceSessions.paper_id, paper_id as string),
                eq(practiceSessions.session_type, session_type as any)
            ),
            orderBy: [desc(practiceSessions.created_at)],
        });

        if (!session) {
            logger.info('No existing session found, returning null');
            res.json(successResponse({
                session: null,
                attempts: [],
            }));
            return;
        }

        logger.info({ sessionId: session.id }, 'Found existing session');

        // Fetch all attempts for this session
        const attemptsData = await db.query.questionAttempts.findMany({
            where: eq(questionAttempts.session_id, session.id),
        });

        logger.info({ count: attemptsData.length }, 'Fetched existing attempts');

        const response: SessionWithAttemptsResponse = {
            session: session as any,
            attempts: attemptsData as any,
        };

        res.json(successResponse(response));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in fetchExistingSessionDetails');
        if (error instanceof ApiError) return next(error);
        next(Errors.internalError());
    }
}

// =============================================================================
// Save Session Details
// =============================================================================
// =============================================================================
// Save Session Details
// =============================================================================
export async function saveSessionDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    const {
        session_id,
        time_spent_seconds,
        completed_at,
        status,
        total_questions,
        current_question_index,
    } = req.body;

    logger.info({ session_id }, 'saveSessionDetails called');

    try {
        // Verify user is authenticated
        if (!req.user) {
            throw Errors.unauthorized();
        }

        // --- Server-Side Score Calculation ---
        // Fetch all attempts for this session to verify score source of truth
        const sessionAttempts = await db.query.questionAttempts.findMany({
            where: eq(questionAttempts.session_id, session_id),
        });

        const backendCorrectCount = sessionAttempts.filter(a => a.is_correct).length;
        const totalQs = total_questions || sessionAttempts.length || 1; // Avoid div/0
        // Calculate score
        const backendScorePercentage = (backendCorrectCount / totalQs) * 100;

        logger.info({ backendCorrectCount, totalQs, backendScorePercentage }, `Server-Side Score Result`);

        // Update session
        const updateData: any = {
            time_spent_seconds: time_spent_seconds,
            status,
            total_questions: total_questions, // Trust client for total count (or could count from exam, but client context is okay here)
            correct_answers: backendCorrectCount, // OVERRIDE client value
            score_percentage: backendScorePercentage.toFixed(2), // OVERRIDE client value
            current_question_index: current_question_index,
            updated_at: new Date(),
        };

        if (completed_at) {
            updateData.completed_at = new Date(completed_at);
        }

        const [updatedSession] = await db
            .update(practiceSessions)
            .set(updateData)
            .where(eq(practiceSessions.id, session_id))
            .returning();

        // If session is completed, trigger analytics update asynchronously
        if (status === 'completed' && req.user.userId) {
            logger.info({ userId: req.user.userId }, `Triggering analytics for user`);
            // Fire-and-forget: don't await this to avoid blocking the response
            analyticsService.triggerAnalytics(req.user.userId).catch(err => {
                logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Failed to trigger analytics');
            });
        }

        logger.info('Session details saved successfully');
        res.json(successResponse(updatedSession));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in saveSessionDetails');
        if (error instanceof ApiError) return next(error);
        next(Errors.internalError());
    }
}

// =============================================================================
// Save Question Attempts (Batch)
// =============================================================================
export async function saveQuestionAttempts(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { attempts } = req.body;

    logger.info({ count: attempts.length }, 'saveQuestionAttempts called');

    try {
        // Verify user is authenticated
        if (!req.user) {
            throw Errors.unauthorized();
        }

        // Fetch all related questions to verify answers
        const questionIds = attempts.map((a: any) => a.question_id);
        const questionsData = await db.query.questions.findMany({
            where: inArray(questions.id, questionIds),
        });

        const questionsMap = new Map(questionsData.map(q => [q.id, q]));

        // Prepare attempts for insertion with server-side verification
        const attemptsToInsert = attempts.map((attempt: any) => {
            const question = questionsMap.get(attempt.question_id);
            if (!question) {
                logger.warn({ questionId: attempt.question_id }, `Question not found for verification`);
                // Fallback to what client sent or false if question missing (shouldn't happen)
                // In a stricter system, we might throw an error.
            }

            // --- Server-Side Verification ---
            let isCorrect = false;
            let realCorrectAnswerStr = "";
            let userAnswerStr = "";

            if (question) {
                // Parse the stored correct answer
                let realCorrectAnswer: any = { answer: "" };
                try {
                    if (typeof question.correct_answer === 'string') {
                        if (question.correct_answer.trim().startsWith('{')) realCorrectAnswer = JSON.parse(question.correct_answer);
                        else realCorrectAnswer = { answer: question.correct_answer };
                    } else {
                        realCorrectAnswer = question.correct_answer;
                    }
                } catch (e) {
                    logger.error({ error: e instanceof Error ? e.message : String(e) }, "Error parsing correct answer for verification");
                }

                // Get the string value of correct answer
                realCorrectAnswerStr = realCorrectAnswer?.answer || "";

                // Get user answer string
                // attempt.user_answer might be an object {user_answer: "A"} or just string "A" depending on frontend
                // The frontend seems to send { user_answer: "A" } inside the user_answer field based on schema usage?
                // Let's inspect what we receive.
                // Based on `daily-content.controller.ts` before edit: `user_answer: JSON.stringify(attempt.user_answer)`
                // schema says `user_answer` is text (jsonb).
                // Frontend usually sends the raw value or wrapped object.
                // Let's normalize.

                let userAnswerVal: any = attempt.user_answer;
                if (typeof userAnswerVal === 'string') {
                    try {
                        // Check if it's stringified JSON
                        if (userAnswerVal.trim().startsWith('{')) {
                            userAnswerVal = JSON.parse(userAnswerVal);
                            userAnswerStr = userAnswerVal?.user_answer || userAnswerVal?.answer || userAnswerVal;
                        } else {
                            userAnswerStr = userAnswerVal;
                        }
                    } catch {
                        userAnswerStr = userAnswerVal;
                    }
                } else if (typeof userAnswerVal === 'object') {
                    userAnswerStr = userAnswerVal?.user_answer || userAnswerVal?.answer || "";
                }

                // Normalize for comparison (trim, uppercase if needed, though IDs are usually specific)
                // Assuming Option IDs like "A", "B", "C" or values.
                isCorrect = String(userAnswerStr).trim() === String(realCorrectAnswerStr).trim();

                logger.info({ questionId: question.id, isCorrect }, `Verification Result`);
            }


            return {
                id: uuidv4(),
                user_id: attempt.user_id,
                session_id: attempt.session_id,
                question_id: attempt.question_id,
                passage_id: attempt.passage_id || null,
                user_answer: JSON.stringify(attempt.user_answer), // Store raw as received/expected
                is_correct: isCorrect, // OVERRIDE client value
                time_spent_seconds: attempt.time_spent_seconds,
                confidence_level: attempt.confidence_level || null,
                marked_for_review: attempt.marked_for_review,
                rationale_viewed: attempt.rationale_viewed,
                rationale_helpful: attempt.rationale_helpful || null,
                ai_feedback: attempt.ai_feedback || null,
                created_at: new Date(),
            };
        });

        // Batch insert
        const insertedAttempts = await db
            .insert(questionAttempts)
            .values(attemptsToInsert)
            .onConflictDoUpdate({
                target: [questionAttempts.user_id, questionAttempts.session_id, questionAttempts.question_id],
                set: {
                    user_answer: sql`excluded.user_answer`,
                    is_correct: sql`excluded.is_correct`,
                    time_spent_seconds: sql`excluded.time_spent_seconds`,
                    updated_at: new Date(), // Implicitly tracked via triggers usually, but good to be explicit
                }
            })
            .returning();

        // =====================================================================
        // Progressive avg_time_seconds update (fire-and-forget)
        // For each attempted question, atomically update times_answered and
        // avg_time_seconds using running average formula.
        // =====================================================================
        const avgTimeUpdates = insertedAttempts.map((attempt: any) =>
            db.execute(sql`
                UPDATE questions
                SET
                    times_answered = COALESCE(times_answered, 0) + 1,
                    avg_time_seconds = CASE
                        WHEN COALESCE(times_answered, 0) = 0 THEN ${attempt.time_spent_seconds}
                        ELSE ROUND(
                            (COALESCE(avg_time_seconds, 0) * COALESCE(times_answered, 0) + ${attempt.time_spent_seconds})::numeric
                            / (COALESCE(times_answered, 0) + 1)
                        )
                    END,
                    times_correct = CASE
                        WHEN ${attempt.is_correct} THEN COALESCE(times_correct, 0) + 1
                        ELSE COALESCE(times_correct, 0)
                    END,
                    updated_at = NOW()
                WHERE id = ${attempt.question_id}
            `)
        );

        // Fire-and-forget: don't block the response
        Promise.all(avgTimeUpdates).catch(err => {
            logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Failed to update question avg_time_seconds');
        });

        logger.info('Question attempts saved successfully with server-side verification.');
        res.json(successResponse(insertedAttempts));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in saveQuestionAttempts');
        if (error instanceof ApiError) return next(error);
        next(Errors.internalError());
    }
}

// =============================================================================
// Fetch Leaderboard
// =============================================================================
export async function fetchLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    const exam_id = req.params.exam_id as string;
    const user_id = req.user?.userId;

    logger.info({ exam_id }, 'fetchLeaderboard called');

    try {
        // Fetch all completed sessions for this exam
        const sessions = await db.select().from(practiceSessions).where(
            and(
                eq(practiceSessions.paper_id, exam_id),
                eq(practiceSessions.status, 'completed')
            )
        );

        if (sessions.length === 0) {
            const response: LeaderboardResponse = {
                leaderboard: [],
                currentUserRank: null,
                totalParticipants: 0,
            };
            res.json(successResponse(response));
            return;
        }

        // Get unique user IDs
        const userIds = Array.from(new Set(sessions.map(s => s.user_id)));

        // Fetch user profiles
        const profiles = await db.query.userProfiles.findMany({
            where: (userProfiles, { inArray }) => inArray(userProfiles.id, userIds),
        });

        // Calculate leaderboard
        const leaderboardMap = calculateLeaderboard(sessions, profiles);

        // Sort by accuracy (precision) first, then by time taken (ascending) as tiebreaker
        const leaderboard = Array.from(leaderboardMap.values())
            .sort((a, b) => {
                // Primary: accuracy (precision) descending — higher accuracy always wins
                if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
                // Secondary: time taken ascending — faster is better when accuracy is equal
                return a.time_taken_seconds - b.time_taken_seconds;
            })
            .map((entry, index) => ({
                ...entry,
                rank: index + 1,
            }));

        // Find current user's rank
        const currentUserRank = user_id
            ? leaderboard.find(entry => entry.user_id === user_id)?.rank || null
            : null;

        const response: LeaderboardResponse = {
            leaderboard,
            currentUserRank,
            totalParticipants: leaderboard.length,
            // current_user_session: // Optional: find session
        };

        logger.info({ count: leaderboard.length }, 'Leaderboard calculated');
        res.json(successResponse(response));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in fetchLeaderboard');
        if (error instanceof ApiError) return next(error);
        next(Errors.internalError());
    }
}

// =============================================================================
// Fetch Articles by IDs
// =============================================================================
export async function fetchArticlesByIds(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { article_ids } = req.body;

    logger.info({ count: article_ids?.length }, 'fetchArticlesByIds called');

    try {
        if (!article_ids || !Array.isArray(article_ids) || article_ids.length === 0) {
            res.json(successResponse([]));
            return;
        }

        // Fetch articles
        const articlesData = await db.query.articles.findMany({
            where: (articles, { inArray }) => inArray(articles.id, article_ids),
        });

        // Map to domain (snake_case)
        const articlesMapped = articlesData.map(a => ({
            id: a.id,
            title: a.title,
            url: a.url,
            source_name: a.source_name,
            author: a.author,
            published_at: a.published_at,
            genre: a.genre,
            topic_tags: a.topic_tags,
            used_in_daily: a.used_in_daily,
            used_in_custom_exam: a.used_in_custom_exam,
            daily_usage_count: a.daily_usage_count,
            custom_exam_usage_count: a.custom_exam_usage_count,
            last_used_at: a.last_used_at,
            semantic_hash: a.semantic_hash,
            extraction_model: a.extraction_model,
            extraction_version: a.extraction_version,
            is_safe_source: a.is_safe_source,
            is_archived: a.is_archived,
            notes: a.notes,
            created_at: a.created_at,
            updated_at: a.updated_at,
            semantic_ideas_and_persona: a.semantic_ideas_and_persona,
        }));

        logger.info({ count: articlesMapped.length }, 'Fetched articles');
        res.json(successResponse(articlesMapped));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in fetchArticlesByIds');
        if (error instanceof ApiError) return next(error);
        next(Errors.internalError());
    }
}

// =============================================================================
// Generate Daily Content (Admin/Cron)
// =============================================================================
export async function generateDailyContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { force } = req.body;

    logger.info({ force }, 'generateDailyContent called');

    try {
        // Import the service
        const { DailyContentService } = await import('../services/daily-content.service.js');

        // Generate daily content
        const result = await DailyContentService.generateDailyContent({ force });

        const response: DailyContentGenerationResponse = {
            success: result.success,
            exam_id: result.exam_id || "",
            message: result.message,
        };

        // Log to Admin Activity
        if (req.user?.userId) {
            await AdminActivityService.logExamGeneration(
                req.user.userId,
                result.exam_id || 'unknown',
                { force, success: result.success }
            );
        }

        res.json(successResponse(response));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in generateDailyContent');
        if (error instanceof ApiError) return next(error);
        next(Errors.internalError());
    }
}
