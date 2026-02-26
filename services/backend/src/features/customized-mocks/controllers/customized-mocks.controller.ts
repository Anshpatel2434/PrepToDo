
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, asc, inArray, sql } from 'drizzle-orm';
import { db } from '../../../db';
import {
    examPapers,
    genres,
    userMetricProficiency,
    practiceSessions,
    passages,
    questions,
    examGenerationState,
    questionAttempts,
    users
} from '../../../db/schema';
import { ApiError, Errors, successResponse } from '../../../common/utils/errors';
import { createChildLogger } from '../../../common/utils/logger.js';

const logger = createChildLogger('customized-mocks-controller');
import { parseCorrectAnswer } from '../../../common/utils/parseCorrectAnswer';
import { runCustomizedMocks } from '../../../workers/customized-mocks/runCustomizedMocks';
import {
    CreateCustomizedMockRequest,
    CustomizedMockWithSession,
    GenerationStateResponse,
    CheckSessionResponse,
    TestDataResponse
} from '../types/customized-mocks.types';
import { AdminActivityService } from '../../admin/services/admin-activity.service';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validates uuid
 */
const isValidUUID = (id: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

// =============================================================================
// Controller Methods
// =============================================================================

/**
 * Fetch user metric proficiency for recommendations
 */
export async function fetchUserMetricProficiency(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { user_id } = req.query;

    logger.info({ user_id }, "fetchUserMetricProficiency called");

    try {
        if (!user_id || typeof user_id !== 'string') {
            throw Errors.badRequest('Invalid user_id');
        }

        const data = await db.query.userMetricProficiency.findMany({
            where: eq(userMetricProficiency.user_id, user_id),
            orderBy: [desc(userMetricProficiency.dimension_type), desc(userMetricProficiency.dimension_key)]
        });

        res.json(successResponse(data));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in fetchUserMetricProficiency');
        next(error instanceof ApiError ? error : Errors.internalError());
    }
}

/**
 * Fetch all available genres from the database
 */
export async function fetchAvailableGenres(req: Request, res: Response, next: NextFunction): Promise<void> {
    logger.info("fetchAvailableGenres called");

    try {
        const data = await db.query.genres.findMany({
            where: eq(genres.is_active, true),
            orderBy: (genres, { asc }) => [asc(genres.name)]
        });

        res.json(successResponse(data));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in fetchAvailableGenres');
        next(error instanceof ApiError ? error : Errors.internalError());
    }
}

/**
 * Fetch all customized mocks created by the current user
 */
/**
 * Fetch all customized mocks created by the current user
 */
export async function fetchCustomizedMocks(req: Request, res: Response, next: NextFunction): Promise<void> {
    const user_id = req.user?.userId;

    logger.info({ user_id }, "fetchCustomizedMocks called");

    try {
        if (!user_id) throw Errors.unauthorized();

        // Fetch exams
        const exams = await db.query.examPapers.findMany({
            where: eq(examPapers.generated_by_user_id, user_id),
            orderBy: (examPapers, { desc }) => [desc(examPapers.created_at)]
        });

        if (!exams.length) {
            res.json(successResponse([]));
            return;
        }

        const examIds: string[] = exams.map(e => e.id);

        let sessions: any[] = [];
        let allPassages: any[] = [];
        let allQuestions: any[] = [];

        if (examIds.length > 0) {
            sessions = await db.query.practiceSessions.findMany({
                where: and(
                    eq(practiceSessions.user_id, user_id),
                    inArray(practiceSessions.paper_id, examIds as any)
                )
            });

            allPassages = await db.query.passages.findMany({
                where: inArray(passages.paper_id, examIds as any),
                columns: { id: true, paper_id: true }
            });

            allQuestions = await db.query.questions.findMany({
                where: inArray(questions.paper_id, examIds as any),
                columns: { id: true, paper_id: true }
            });
        }

        const examsWithStatus: CustomizedMockWithSession[] = exams.map(exam => {
            const examSessions = sessions.filter(s => s.paper_id === exam.id);
            const latestSession = examSessions.sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            })[0];

            let sessionStatus: "not_started" | "in_progress" | "completed" | null = "not_started";
            if (latestSession) {
                if (latestSession.status === "completed") sessionStatus = "completed";
                else if (latestSession.status === "in_progress" || latestSession.status === "paused") sessionStatus = "in_progress";
            }

            const passagesCount = allPassages.filter(p => p.paper_id === exam.id).length;
            const questionsCount = allQuestions.filter(q => q.paper_id === exam.id).length;

            return {
                ...exam,
                session_status: sessionStatus,
                session_id: latestSession?.id,
                passages_count: passagesCount,
                questions_count: questionsCount,
                generation_status: exam.generation_status as any
            };
        });

        res.json(successResponse(examsWithStatus));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in fetchCustomizedMocks');
        next(error instanceof ApiError ? error : Errors.internalError());
    }
}

/**
 * Create a new customized mock
 */
export async function createCustomizedMock(req: Request, res: Response, next: NextFunction): Promise<void> {
    const params = req.body as CreateCustomizedMockRequest;
    const user_id = req.user?.userId;

    logger.info({ params }, "createCustomizedMock called");

    try {
        if (!user_id || user_id !== params.user_id) throw Errors.unauthorized();

        // --- Quota Check ---
        const [user] = await db
            .select({ customized_mocks_remaining: users.customized_mocks_remaining })
            .from(users)
            .where(eq(users.id, user_id))
            .limit(1);

        if (!user || (user.customized_mocks_remaining ?? 0) < 1) {
            throw Errors.badRequest('You have no customized mocks remaining. Please contact support to get more.');
        }
        // ---------------------

        // Prepare parameters (assign exam_id here to control it)
        // Wait: runCustomizedMocks orchestrator usually creates the ID if not passed, 
        // but to return it immediately, we should generate it here.
        // We need to update runCustomizedMocks to accept an ID or use the DataManager inside it properly.
        // Based on my review, runCustomizedMocks instantiates DataManager which generates a fresh ID.
        // I will enable passing examId to runCustomizedMocks or make runCustomizedMocks return the ID quickly?
        // No, runCustomizedMocks is a promise.
        // Best approach: Generate ID here, pass to runCustomizedMocks (I will update runCustomizedMocks to accept it).

        const examId = uuidv4();

        // 1. Create initial Exam Paper record immediately
        await db.insert(examPapers).values({
            id: examId,
            name: params.mock_name || "Custom Mock Test",
            generated_by_user_id: user_id,
            generation_status: 'initializing',
            is_official: false,
            created_at: new Date(),
            updated_at: new Date(),
        });

        // 2. Create State record immediately
        await db.insert(examGenerationState).values({
            exam_id: examId,
            user_id: user_id,
            status: 'initializing',
            current_step: 1,
            total_steps: 7,
            params: params,
            created_at: new Date(),
            updated_at: new Date()
        });

        // Asynchronously start the generation worker
        runCustomizedMocks({
            ...params,
            mock_name: params.mock_name || "Custom Mock Test",
            num_passages: params.num_passages || 4,
            total_questions: params.total_questions || 24,
            difficulty_target: params.difficulty_target || "mixed",
            per_question_time_limit: params.per_question_time_limit || undefined,
            time_limit_minutes: params.time_limit_minutes || undefined,
            question_type_distribution: {
                rc_questions: params.question_type_distribution?.rc_questions ?? 4,
                para_summary: params.question_type_distribution?.para_summary ?? 2,
                para_completion: params.question_type_distribution?.para_completion ?? 2,
                para_jumble: params.question_type_distribution?.para_jumble ?? 2,
                odd_one_out: params.question_type_distribution?.odd_one_out ?? 2
            } as any,
            exam_id: examId
        }).catch(err => {
            logger.error({ error: err instanceof Error ? err.message : String(err), examId }, `Background worker failed`);
            // Verify failure state is recorded
            db.update(examGenerationState)
                .set({ status: 'failed', error_message: err.message || 'Unknown error' })
                .where(eq(examGenerationState.exam_id, examId))
                .catch(dbErr => logger.error({ error: dbErr instanceof Error ? dbErr.message : String(dbErr) }, "Failed to update failure state"));

            db.update(examPapers)
                .set({ generation_status: 'failed' })
                .where(eq(examPapers.id, examId))
                .catch(dbErr => logger.error({ error: dbErr instanceof Error ? dbErr.message : String(dbErr) }, "Failed to update exam status on failure"));
        });

        // Return immediately with the ID

        // Decrement user's customized mocks quota
        await db.update(users)
            .set({ customized_mocks_remaining: sql`GREATEST(${users.customized_mocks_remaining} - 1, 0)` })
            .where(eq(users.id, user_id));

        // Log activity
        await AdminActivityService.logExamGeneration(user_id, examId, params);

        res.json(successResponse({
            success: true,
            exam_id: examId,
            message: "Mock generation started",
            mock_name: params.mock_name
        }));

    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in createCustomizedMock');
        next(error instanceof ApiError ? error : Errors.internalError());
    }
}

/**
 * Check if user has an existing session for a mock
 */
export async function checkExistingSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { paper_id } = req.query;
    const user_id = req.user?.userId;

    logger.info({ paper_id }, "checkExistingSession called");

    try {
        if (!user_id) throw Errors.unauthorized();
        if (!paper_id || typeof paper_id !== 'string') throw Errors.badRequest("Invalid paper_id");

        const sessions = await db.query.practiceSessions.findMany({
            where: and(
                eq(practiceSessions.user_id, user_id),
                eq(practiceSessions.paper_id, paper_id)
            ),
            orderBy: (practiceSessions, { desc }) => [desc(practiceSessions.created_at)],
            limit: 1
        });

        if (!sessions.length) {
            res.json(successResponse({ has_session: false, status: "not_started" }));
            return;
        }

        const latestSession = sessions[0];
        let status = "not_started";
        if (latestSession.status === "completed") status = "completed";
        else if (latestSession.status === "in_progress" || latestSession.status === "paused") status = "in_progress";

        res.json(successResponse({
            has_session: true,
            session: latestSession,
            status
        }));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in checkExistingSession');
        next(error instanceof ApiError ? error : Errors.internalError());
    }
}

/**
 * Fetch mock test data by exam ID
 */
export async function fetchMockTestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { exam_id } = req.params;
    const include_solutions = req.query.include_solutions === 'true';

    logger.info({ exam_id, include_solutions }, "fetchMockTestById called");

    try {
        const exam = await db.query.examPapers.findFirst({
            where: eq(examPapers.id, exam_id as any)
        });

        if (!exam) throw Errors.notFound("Exam not found");

        const examPassages = await db.query.passages.findMany({
            where: eq(passages.paper_id, exam_id as any)
        });

        const examQuestions = await db.query.questions.findMany({
            where: eq(questions.paper_id, exam_id as any),
            orderBy: [asc(questions.created_at), asc(questions.id)],
        });

        // Parse and filter fields
        const questionsMapped = examQuestions.map(q => {
            let parsedOptions = q.options;
            if (typeof q.options === 'string') { try { parsedOptions = JSON.parse(q.options); } catch { } }

            let parsedJumbled = q.jumbled_sentences;
            if (typeof q.jumbled_sentences === 'string') { try { parsedJumbled = JSON.parse(q.jumbled_sentences); } catch { } }

            const parsedCorrectAnswer = include_solutions
                ? parseCorrectAnswer(q.correct_answer)
                : { answer: "" };

            return {
                ...q,
                options: parsedOptions,
                jumbled_sentences: parsedJumbled,
                correct_answer: include_solutions ? parsedCorrectAnswer : null,
                rationale: include_solutions ? q.rationale : null,
            };
        });

        res.json(successResponse({
            examInfo: exam,
            passages: examPassages,
            questions: questionsMapped
        }));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in fetchMockTestById');
        next(error instanceof ApiError ? error : Errors.internalError());
    }
}

/**
 * Start a new mock session
 */
export async function startMockSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { user_id, paper_id, passage_ids, question_ids, time_limit_seconds } = req.body;
    const authUserId = req.user?.userId;

    logger.info({ user_id }, "startMockSession called");

    try {
        if (!authUserId || authUserId !== user_id) throw Errors.unauthorized();

        const [session] = await db.insert(practiceSessions).values({
            id: uuidv4(),
            user_id,
            paper_id,
            session_type: "timed_test",
            mode: "test",
            passage_ids: passage_ids || null,
            question_ids: question_ids || null,
            time_limit_seconds,
            status: "in_progress",
            time_spent_seconds: 0,
            pause_duration_seconds: 0,
            total_questions: question_ids?.length || 0,
            correct_answers: 0,
            current_question_index: 0,
            is_group_session: false,
            points_earned: 0,
            is_analysed: false,
            created_at: new Date(),
            updated_at: new Date()
        }).returning();

        // Log activity
        await AdminActivityService.logSessionStart(authUserId, session.id, 'custom_mock');

        res.json(successResponse(session));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in startMockSession');
        next(error instanceof ApiError ? error : Errors.internalError());
    }
}

/**
 * Fetch existing session details
 */
export async function fetchExistingMockSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { user_id, paper_id } = req.query;
    const authUserId = req.user?.userId;

    try {
        if (!authUserId || authUserId !== user_id) throw Errors.unauthorized();
        if (!paper_id || typeof paper_id !== 'string') throw Errors.badRequest("Invalid paper_id");

        const sessions = await db.query.practiceSessions.findMany({
            where: and(
                eq(practiceSessions.user_id, authUserId),
                eq(practiceSessions.paper_id, paper_id),
                eq(practiceSessions.session_type, "timed_test")
            ),
            orderBy: (practiceSessions, { desc }) => [desc(practiceSessions.created_at)],
            limit: 1
        });

        if (!sessions.length) throw Errors.notFound("No existing session found");

        const session = sessions[0];
        const attempts = await db.query.questionAttempts.findMany({
            where: eq(questionAttempts.session_id, session.id)
        });

        res.json(successResponse({
            session,
            attempts
        }));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in fetchExistingMockSession');
        next(error instanceof ApiError ? error : Errors.internalError());
    }
}

/**
 * Save session details
 */
export async function saveSessionDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    const {
        session_id,
        time_spent_seconds,
        completed_at,
        status,
        total_questions,
        correct_answers,
        score_percentage,
        current_question_index
    } = req.body;

    try {
        if (!req.user) throw Errors.unauthorized();

        const updateData: any = {
            time_spent_seconds,
            status,
            total_questions,
            correct_answers,
            score_percentage,
            current_question_index,
            updated_at: new Date()
        };

        if (completed_at) updateData.completed_at = new Date(completed_at);

        const [updated] = await db.update(practiceSessions)
            .set(updateData)
            .where(eq(practiceSessions.id, session_id))
            .returning();

        res.json(successResponse(updated));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in saveSessionDetails');
        next(error instanceof ApiError ? error : Errors.internalError());
    }
}

/**
 * Save question attempts
 */
export async function saveQuestionAttempts(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { attempts } = req.body;

    try {
        if (!req.user) throw Errors.unauthorized();

        const questionIds = attempts.map((a: any) => a.question_id);
        const questionsData = await db.query.questions.findMany({
            where: inArray(questions.id, questionIds),
        });

        const questionsMap = new Map(questionsData.map(q => [q.id, q]));

        const attemptsToInsert = attempts.map((attempt: any) => {
            const question = questionsMap.get(attempt.question_id);

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
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        realCorrectAnswer = question.correct_answer as any;
                    }
                } catch (e) {
                    logger.error({ error: e instanceof Error ? e.message : String(e) }, "Error parsing correct answer for verification");
                }

                realCorrectAnswerStr = realCorrectAnswer?.answer || "";

                // Get user answer string
                let userAnswerVal: any = attempt.user_answer;
                if (typeof userAnswerVal === 'string') {
                    try {
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

                isCorrect = String(userAnswerStr).trim() === String(realCorrectAnswerStr).trim();
                logger.info({ questionId: question.id, isCorrect }, `Verification Result`);
            }

            return {
                id: attempt.id || uuidv4(),
                user_id: attempt.user_id,
                session_id: attempt.session_id,
                question_id: attempt.question_id,
                passage_id: attempt.passage_id || null,
                user_answer: JSON.stringify(attempt.user_answer),
                is_correct: isCorrect, // OVERRIDE client value
                time_spent_seconds: attempt.time_spent_seconds,
                confidence_level: attempt.confidence_level || null,
                marked_for_review: attempt.marked_for_review,
                rationale_viewed: attempt.rationale_viewed,
                rationale_helpful: attempt.rationale_helpful || null,
                ai_feedback: attempt.ai_feedback || null,
                created_at: new Date(),
                updated_at: new Date()
            };
        });

        // Batch upsert using single statement (neon-http doesn't support transactions)
        await db.insert(questionAttempts)
            .values(attemptsToInsert)
            .onConflictDoUpdate({
                target: [questionAttempts.user_id, questionAttempts.session_id, questionAttempts.question_id],
                set: {
                    user_answer: sql`excluded.user_answer`,
                    is_correct: sql`excluded.is_correct`,
                    time_spent_seconds: sql`excluded.time_spent_seconds`,
                    updated_at: new Date()
                }
            })
            .returning();

        res.json(successResponse(attemptsToInsert));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in saveQuestionAttempts');
        next(error instanceof ApiError ? error : Errors.internalError());
    }
}

/**
 * Fetch generation status
 */
export async function fetchGenerationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { exam_id } = req.params;

    logger.info({ exam_id }, "fetchGenerationStatus called");

    try {
        const state = await db.query.examGenerationState.findFirst({
            where: eq(examGenerationState.exam_id, exam_id as any)
        });

        if (!state) {
            res.json(successResponse({ state: null, isGenerating: false }));
            return;
        }

        const isGenerating = state.status !== "completed" && state.status !== "failed";

        res.json(successResponse({
            state: {
                ...state,
                // Ensure non-null defaults for optional fields if needed by frontend strict types
                error_message: state.error_message || undefined
            },
            isGenerating
        }));
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in fetchGenerationStatus');
        next(error instanceof ApiError ? error : Errors.internalError());
    }
}
