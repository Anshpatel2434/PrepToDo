// VARC Analytics - Phase A: Fetch Session Data

import z from "zod";
import { PassageArraySchema, PassageSchema, PracticeSession, PracticeSessionSchema, QuestionArraySchema, QuestionAttempt, QuestionAttemptArraySchema, QuestionAttemptSchema, QuestionSchema, type AttemptDatum, type PhaseAResult } from "../types";

export async function phaseA_fetchSessionData(
    supabase: any,
    session_id: string,
    user_id: string
): Promise<PhaseAResult> {

    console.log('📥 [Phase A] Fetching session data');

    // Fetch and lock session row (idempotence check)
    const { data: session, error: sessionError } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('id', session_id)
        .eq('user_id', user_id)
        .single();

    if (sessionError) throw new Error(`Session fetch failed: ${sessionError.message}`);

    let sessionVerified : z.infer<typeof PracticeSessionSchema>;
    try {
        sessionVerified = PracticeSessionSchema.parse(session);
        console.log("Validation passed for session : ", sessionVerified);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("Validation failed for session: ", error.issues[0]);
        } else {
            console.error("Unexpected error: ", error);
        }
    }

    // Critical idempotence check
    if (session.is_analysed) {
        console.log('⚠️ [Phase A] Session already analysed, skipping');
        return { alreadyAnalysed: true, session, dataset: [] };
    }

    // Verify session is completed
    if (session.status !== 'completed') {
        throw new Error(`Session status is '${session.status}', expected 'completed'`);
    }

    // Fetch all attempts for this session
    const { data: attempts, error: attemptsError } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('session_id', session_id)
        .eq('user_id', user_id);

    if (attemptsError) throw new Error(`Attempts fetch failed: ${attemptsError.message}`);

    let attemptsVerified: z.infer<typeof QuestionAttemptSchema>[];
        try {
            attemptsVerified = QuestionAttemptArraySchema.parse(attempts);
            console.log("Validation passed for attempts: ", attemptsVerified);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error("Validation failed for attempts: ", error.issues[0]);
            } else {
                console.error("Unexpected error: ", error);
            }
        }

    console.log(`📊 [Phase A] Fetched ${attemptsVerified.length} attempts`);

    if (attemptsVerified.length === 0) {
        console.log('⚠️ [Phase A] No attempts found for this session');
        return { alreadyAnalysed: false, session, dataset: [] };
    }

    // Fetch question metadata
    const questionIds = Array.from(new Set(attemptsVerified.map(a => a.question_id)));

    const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

    if (questionsError) throw new Error(`Questions fetch failed: ${questionsError.message}`);

    let questionsVerified: z.infer<typeof QuestionSchema>[];
            try {
                questionsVerified = QuestionArraySchema.parse(questions);
                console.log("Validation passed: ", questionsVerified);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    console.error("Validation failed: ", error.issues[0]);
                } else {
                    console.error("Unexpected error: ", error);
                }
            }

    // Build question lookup map
    const questionMap = new Map(questionsVerified.map(q => [q.id, q]));

    // Fetch passage metadata (for genre)
    const passageIds = Array.from(new Set(attemptsVerified.map(a => a.passage_id).filter(Boolean)));

    let passageMap = new Map();
    if (passageIds.length > 0) {
        let passageVerified: z.infer<typeof PassageSchema>[];
        const { data: passages, error: passagesError } = await supabase
            .from('passages')
            .select('*')
            .in('id', passageIds);

        if (passagesError) throw new Error(`Passages fetch failed: ${passagesError.message}`);
        try {
            passageVerified = PassageArraySchema.parse(passages);
            console.log("Validation passed: ", passageVerified);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error("Validation failed: ", error.issues[0]);
            } else {
                console.error("Unexpected error: ", error);
            }
        }
        // Build passage lookup map
        passageMap = new Map(passageVerified.map(p => [p.id, p]));
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
        };
    });

    console.log(`✅ [Phase A] Constructed dataset with ${dataset.length} attempts`);

    return {
        alreadyAnalysed: false,
        session,
        dataset,
        sessionMetadata: {
            session_id,
            user_id,
            completed_at: session.completed_at,
            session_type: session.session_type,
        }
    }
}