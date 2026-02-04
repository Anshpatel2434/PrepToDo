// VARC Analytics - Phase A: Fetch Session Data

import {
    PassageArraySchema,
    PracticeSessionSchema,
    QuestionArraySchema,
    QuestionAttemptArraySchema,
    type AttemptDatum,
    type PhaseAResult
} from "../types";
import { db } from "../../../db";
import { practiceSessions, questionAttempts, questions, passages } from "../../../db/schema";
import { eq, inArray, and } from "drizzle-orm";

export async function phaseA_fetchSessionData(
    session_id: string,
    user_id: string
): Promise<PhaseAResult> {

    console.log('📥 [Phase A] Fetching session data');

    // Fetch and lock session row (idempotence check)
    const session = await db.query.practiceSessions.findFirst({
        where: and(
            eq(practiceSessions.id, session_id),
            eq(practiceSessions.userId, user_id)
        ),
    });

    if (!session) throw new Error(`Session fetch failed: session not found`);

    // Validate session with Zod schema
    const sessionMapped = mapSessionToSnakeCase(session);
    const sessionParsed = PracticeSessionSchema.safeParse(sessionMapped);
    if (!sessionParsed.success) {
        console.error("Validation failed for session:", sessionParsed.error.issues[0]);
        throw new Error(`Invalid practice_session payload for session_id=${session_id}`);
    }
    console.log("Validation passed for session");
    const sessionVerified = sessionParsed.data;

    // Critical idempotence check
    if (sessionVerified.is_analysed) {
        console.log('⚠️ [Phase A] Session already analysed, skipping');
        return { alreadyAnalysed: true, session: sessionVerified, dataset: [] };
    }

    // Verify session is completed
    if (sessionVerified.status !== 'completed') {
        throw new Error(`Session status is '${sessionVerified.status}', expected 'completed'`);
    }

    // Fetch all attempts for this session
    const attempts = await db.query.questionAttempts.findMany({
        where: and(
            eq(questionAttempts.sessionId, session_id),
            eq(questionAttempts.userId, user_id)
        ),
    });

    // Validate attempts with Zod schema
    const attemptsMapped = attempts.map(mapAttemptToSnakeCase);
    const attemptsParsed = QuestionAttemptArraySchema.safeParse(attemptsMapped);
    if (!attemptsParsed.success) {
        console.error("Validation failed for attempts:", attemptsParsed.error.issues[0]);
        throw new Error(`Invalid question_attempts payload for session_id=${session_id}`);
    }
    console.log("Validation passed for attempts");
    const attemptsVerified = attemptsParsed.data;

    console.log(`📊 [Phase A] Fetched ${attemptsVerified.length} attempts`);

    if (attemptsVerified.length === 0) {
        console.log('⚠️ [Phase A] No attempts found for this session');
        return { alreadyAnalysed: false, session: sessionVerified, dataset: [] };
    }

    // Fetch question metadata
    const questionIds = Array.from(new Set(attemptsVerified.map(a => a.question_id)));

    const questionsData = questionIds.length > 0
        ? await db.query.questions.findMany({
            where: inArray(questions.id, questionIds)
        })
        : [];

    // Validate questions with Zod schema
    const questionsMapped = questionsData.map(mapQuestionToSnakeCase);
    const questionsParsed = QuestionArraySchema.safeParse(questionsMapped);
    if (!questionsParsed.success) {
        console.error("Validation failed for questions:", questionsParsed.error.issues[0]);
        throw new Error(`Invalid questions payload for session_id=${session_id}`);
    }
    console.log("Validation passed for questions");
    const questionsVerified = questionsParsed.data;

    // Build question lookup map
    const questionMap = new Map(questionsVerified.map(q => [q.id, q]));

    // Fetch passage metadata (for genre)
    const passageIds = Array.from(new Set(attemptsVerified.map(a => a.passage_id).filter(Boolean)));

    let passageMap = new Map();
    if (passageIds.length > 0) {
        const passagesData = await db.query.passages.findMany({
            where: inArray(passages.id, passageIds as string[])
        });

        // Validate passages with Zod schema
        const passagesMapped = passagesData.map(mapPassageToSnakeCase);
        const passagesParsed = PassageArraySchema.safeParse(passagesMapped);
        if (!passagesParsed.success) {
            console.error("Validation failed for passages:", passagesParsed.error.issues[0]);
            throw new Error(`Invalid passages payload for session_id=${session_id}`);
        }
        console.log("Validation passed for passages");
        const passagesVerified = passagesParsed.data;

        // Build passage lookup map
        passageMap = new Map(passagesVerified.map(p => [p.id, p]));
    }

    // Construct normalized dataset
    const dataset: AttemptDatum[] = attemptsVerified.map(attempt => {
        const question = questionMap.get(attempt.question_id);
        const passage = attempt.passage_id ? passageMap.get(attempt.passage_id) : null;

        if (!question) {
            throw new Error(`Question ${attempt.question_id} not found`);
        }

        return {
            attempt_id: attempt.id,
            question_id: attempt.question_id,
            passage_id: attempt.passage_id,

            question_type: question.question_type,
            genre: passage?.genre || null,
            difficulty: question.difficulty || null,

            correct: attempt.is_correct,
            time_spent_seconds: attempt.time_spent_seconds,
            confidence_level: attempt.confidence_level,

            // Extract metric keys from question tags
            metric_keys: question.tags || [],

            // For Phase C
            user_answer: attempt.user_answer,
            question_text: question.question_text,
            options: question.options,
            correct_answer: question.correct_answer,
            jumbled_sentences: question.jumbled_sentences,
        };
    });

    console.log(`✅ [Phase A] Constructed dataset with ${dataset.length} attempts`);

    return {
        alreadyAnalysed: false,
        session: sessionVerified,
        dataset,
        sessionMetadata: {
            session_id,
            user_id,
            completed_at: sessionVerified.completed_at,
            session_type: sessionVerified.session_type,
        }
    }
}

// Helper to map Drizzle CamelCase result to Zod SnakeCase schema expected by logic
function mapSessionToSnakeCase(session: any): any {
    const safeParseJson = (val: any): any => {
        if (!val) return null;
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return null; }
        }
        return val;
    };

    return {
        id: session.id,
        user_id: session.userId,
        paper_id: session.paperId || "",
        session_type: session.sessionType,
        mode: session.mode,
        passage_ids: safeParseJson(session.passageIds),
        question_ids: safeParseJson(session.questionIds),
        target_difficuly: session.targetDifficulty, // Note: typo in original schema
        target_genres: safeParseJson(session.targetGenres),
        target_question_types: safeParseJson(session.targetQuestionTypes),
        time_limit_seconds: session.timeLimitSeconds,
        time_spent_seconds: session.timeSpentSeconds,
        started_at: session.startedAt?.toISOString() || new Date().toISOString(),
        completed_at: session.completedAt?.toISOString() || new Date().toISOString(),
        paused_at: session.pausedAt?.toISOString(),
        pause_duration_seconds: session.pauseDurationSeconds || 0,
        total_questions: session.totalQuestions || 0,
        correct_answers: session.correctAnswers || 0,
        current_question_index: session.currentQuestionIndex || 0,
        is_group_session: session.isGroupSession || false,
        group_id: session.groupId,
        status: session.status,
        score_percentage: parseFloat(session.scorePercentage || "0"),
        points_earned: session.pointsEarned || 0,
        created_at: session.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: session.updatedAt?.toISOString(),
        analytics: safeParseJson(session.analytics),
        is_analysed: session.isAnalysed,
    };
}

function mapAttemptToSnakeCase(attempt: any): any {
    const safeParseJson = (val: any): any => {
        if (!val) return null;
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return null; }
        }
        return val;
    };

    return {
        id: attempt.id,
        user_id: attempt.userId,
        session_id: attempt.sessionId,
        question_id: attempt.questionId,
        passage_id: attempt.passageId,
        user_answer: safeParseJson(attempt.userAnswer),
        is_correct: attempt.isCorrect,
        time_spent_seconds: attempt.timeSpentSeconds,
        confidence_level: attempt.confidenceLevel,
        marked_for_review: attempt.markedForReview,
        rationale_viewed: attempt.rationaleViewed,
        rationale_helpful: attempt.rationaleHelpful,
        ai_feedback: attempt.aiFeedback,
        created_at: attempt.createdAt?.toISOString() || new Date().toISOString(),
    };
}

function mapQuestionToSnakeCase(question: any): any {
    const safeParseJson = (val: any): any => {
        if (!val) return null;
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return null; }
        }
        return val;
    };

    return {
        id: question.id,
        passage_id: question.passageId,
        question_text: question.questionText,
        question_type: question.questionType,
        options: safeParseJson(question.options),
        jumbled_sentences: safeParseJson(question.jumbledSentences),
        correct_answer: safeParseJson(question.correctAnswer),
        rationale: question.rationale,
        difficulty: question.difficulty,
        tags: question.tags || [],
        created_at: question.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: question.updatedAt?.toISOString() || new Date().toISOString(),
    };
}

function mapPassageToSnakeCase(passage: any): any {
    return {
        id: passage.id,
        title: passage.title,
        content: passage.content,
        word_count: passage.wordCount,
        genre: passage.genre,
        difficulty: passage.difficulty,
        source: passage.source,
        paper_id: passage.paperId,
        is_daily_pick: passage.isDailyPick || false,
        is_featured: passage.isFeatured || false,
        is_archived: passage.isArchived || false,
        created_at: passage.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: passage.updatedAt?.toISOString() || new Date().toISOString(),
    };
}