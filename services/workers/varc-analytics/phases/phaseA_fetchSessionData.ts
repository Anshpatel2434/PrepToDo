// VARC Analytics - Phase A: Fetch Session Data

import type { AttemptDatum, PhaseAResult } from "../types";

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

  console.log(`📊 [Phase A] Fetched ${attempts.length} attempts`);

  if (attempts.length === 0) {
    console.log('⚠️ [Phase A] No attempts found for this session');
    return { alreadyAnalysed: false, session, dataset: [] };
  }

  // Fetch question metadata
  const questionIds = [...new Set(attempts.map(a => a.question_id))];

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, question_type, tags, passage_id, question_text, options, correct_answer')
    .in('id', questionIds);

  if (questionsError) throw new Error(`Questions fetch failed: ${questionsError.message}`);

  // Build question lookup map
  const questionMap = new Map(questions.map(q => [q.id, q]));

  // Fetch passage metadata (for genre)
  const passageIds = [...new Set(attempts.map(a => a.passage_id).filter(Boolean))];

  let passageMap = new Map();
  if (passageIds.length > 0) {
    const { data: passages, error: passagesError } = await supabase
      .from('passages')
      .select('id, genre, word_count')
      .in('id', passageIds);

    if (passagesError) throw new Error(`Passages fetch failed: ${passagesError.message}`);

    // Build passage lookup map
    passageMap = new Map(passages.map(p => [p.id, p]));
  }

  // Construct normalized dataset
  const dataset: AttemptDatum[] = attempts.map(attempt => {
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

      eliminated_options: attempt.eliminated_options,

      // Extract reasoning node IDs from question tags
      // ASSUMPTION: tags contains UUID strings matching graph_nodes.id
      reasoning_node_ids: question.tags || [],

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
  };
}
