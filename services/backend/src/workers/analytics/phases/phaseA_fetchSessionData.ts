// VARC Analytics - Phase A: Fetch Session Data

import {
    PassageArraySchema,
    PracticeSessionSchema,
    QuestionArraySchema,
    QuestionAttemptArraySchema,
    type AttemptDatum,
    type PhaseAResult
} from "../types";
import { v4 as uuidv4 } from 'uuid';
import { db } from "../../../db";
import { practiceSessions, questionAttempts, questions, passages } from "../../../db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger('analytics-phase-a');

// Helper to safely parse JSON if it's a string
const safeParseJson = (val: any): any => {
    if (!val) return null;
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (e) { return null; }
    }
    return val;
};

export async function phaseA_fetchSessionData(
    session_id: string,
    user_id: string
): Promise<PhaseAResult> {

    logger.info('Fetching session data');

    // Fetch and lock session row (idempotence check)
    const session = await db.query.practiceSessions.findFirst({
        where: and(
            eq(practiceSessions.id, session_id),
            eq(practiceSessions.user_id, user_id)
        ),
    });

    if (!session) throw new Error(`Session fetch failed: session not found`);

    // Normalize session data for Zod
    // Drizzle now returns snake_case, but we ensure types match Zod expectations (JSON parsing, dates)
    const sessionMapped = {
        ...session,
        // Parse JSON fields if they are strings (Drizzle text columns)
        passage_ids: session.passage_ids, // UUID array, handled by Drizzle
        question_ids: session.question_ids, // UUID array
        target_genres: safeParseJson(session.target_genres),
        target_question_types: safeParseJson(session.target_question_types),
        analytics: safeParseJson(session.analytics),

        // Ensure numbers are numbers (Drizzle numeric/decimal returns string)
        score_percentage: typeof session.score_percentage === 'string' ? parseFloat(session.score_percentage) : session.score_percentage,

        // Ensure dates are strings for Zod (if Zod expects ISO strings)
        started_at: session.started_at instanceof Date ? session.started_at.toISOString() : session.started_at,
        completed_at: session.completed_at instanceof Date ? session.completed_at.toISOString() : session.completed_at,
        paused_at: session.paused_at instanceof Date ? session.paused_at.toISOString() : session.paused_at,
        created_at: session.created_at instanceof Date ? session.created_at.toISOString() : session.created_at,
        updated_at: session.updated_at instanceof Date ? session.updated_at.toISOString() : session.updated_at,
    };

    // Validate session with Zod schema
    const sessionParsed = PracticeSessionSchema.safeParse(sessionMapped);
    if (!sessionParsed.success) {
        logger.error({ error: sessionParsed.error.issues[0], sessionId: session_id }, "Validation failed for session");
        throw new Error(`Invalid practice_session payload for session_id=${session_id}`);
    }
    logger.info("Validation passed for session");
    const sessionVerified = sessionParsed.data;

    // Critical idempotence check
    if (sessionVerified.is_analysed) {
        logger.warn({ sessionId: session_id }, 'Session already analysed, skipping');
        return { alreadyAnalysed: true, session: sessionVerified, dataset: [] };
    }

    // Verify session is completed
    if (sessionVerified.status !== 'completed') {
        throw new Error(`Session status is '${sessionVerified.status}', expected 'completed'`);
    }

    // Fetch all attempts for this session
    const attempts = await db.query.questionAttempts.findMany({
        where: and(
            eq(questionAttempts.session_id, session_id),
            eq(questionAttempts.user_id, user_id)
        ),
    });

    // Normalize attempts
    const attemptsMapped = attempts.map(attempt => ({
        ...attempt,
        user_answer: safeParseJson(attempt.user_answer),
        created_at: attempt.created_at instanceof Date ? attempt.created_at.toISOString() : attempt.created_at,
    }));

    // Validate attempts with Zod schema
    const attemptsParsed = QuestionAttemptArraySchema.safeParse(attemptsMapped);
    if (!attemptsParsed.success) {
        logger.error({ error: attemptsParsed.error.issues[0], sessionId: session_id }, "Validation failed for attempts");
        throw new Error(`Invalid question_attempts payload for session_id=${session_id}`);
    }
    logger.info("Validation passed for attempts");
    const attemptsVerified = attemptsParsed.data;

    logger.info({ attemptsCount: attemptsVerified.length }, "Fetched attempts");

    if (attemptsVerified.length === 0) {
        logger.warn({ sessionId: session_id }, 'No attempts found for this session');
        return { alreadyAnalysed: false, session: sessionVerified, dataset: [] };
    }

    // Fetch question metadata
    const questionIds = Array.from(new Set(attemptsVerified.map(a => a.question_id)));

    const questionsData = questionIds.length > 0
        ? await db.query.questions.findMany({
            where: inArray(questions.id, questionIds)
        })
        : [];

    // Normalize questions
    const questionsMapped = questionsData.map(q => ({
        ...q,
        options: safeParseJson(q.options),
        jumbled_sentences: safeParseJson(q.jumbled_sentences),
        correct_answer: safeParseJson(q.correct_answer),
        created_at: q.created_at instanceof Date ? q.created_at.toISOString() : q.created_at,
        updated_at: q.updated_at instanceof Date ? q.updated_at.toISOString() : q.updated_at,
    }));

    // Validate questions with Zod schema
    const questionsParsed = QuestionArraySchema.safeParse(questionsMapped);
    if (!questionsParsed.success) {
        logger.error({ error: questionsParsed.error.issues[0], sessionId: session_id }, "Validation failed for questions");
        throw new Error(`Invalid questions payload for session_id=${session_id}`);
    }
    logger.info("Validation passed for questions");
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

        // Normalize passages
        const passagesMapped = passagesData.map(p => ({
            ...p,
            created_at: p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at,
            updated_at: p.updated_at instanceof Date ? p.updated_at.toISOString() : p.updated_at,
        }));

        // Validate passages with Zod schema
        const passagesParsed = PassageArraySchema.safeParse(passagesMapped);
        if (!passagesParsed.success) {
            logger.error({ error: passagesParsed.error.issues[0], sessionId: session_id }, "Validation failed for passages");
            throw new Error(`Invalid passages payload for session_id=${session_id}`);
        }
        logger.info("Validation passed for passages");
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

    logger.info({ datasetSize: dataset.length }, "Constructed dataset");

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