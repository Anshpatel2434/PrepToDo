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

    const sessionParsed = PracticeSessionSchema.safeParse(session);
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
    const { data: attempts, error: attemptsError } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('session_id', session_id)
        .eq('user_id', user_id);

    if (attemptsError) throw new Error(`Attempts fetch failed: ${attemptsError.message}`);

    const attemptsParsed = QuestionAttemptArraySchema.safeParse(attempts);
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

    const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

    if (questionsError) throw new Error(`Questions fetch failed: ${questionsError.message}`);

    const questionsParsed = QuestionArraySchema.safeParse(questions);
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
        const { data: passages, error: passagesError } = await supabase
            .from('passages')
            .select('*')
            .in('id', passageIds);

        if (passagesError) throw new Error(`Passages fetch failed: ${passagesError.message}`);
        
        const passagesParsed = PassageArraySchema.safeParse(passages);
        if (!passagesParsed.success) {
            console.error("Validation failed for passages:", passagesParsed.error.issues[0]);
            throw new Error(`Invalid passages payload for session_id=${session_id}`);
        }
        console.log("Validation passed for passages");
        const passageVerified = passagesParsed.data;
        
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