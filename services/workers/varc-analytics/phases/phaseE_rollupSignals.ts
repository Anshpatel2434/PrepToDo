// VARC Analytics - Phase E: Rollup Signals

export async function phaseE_rollupSignals(
  supabase: any,
  user_id: string
) {

  console.log('📦 [Phase E] Rolling up user_proficiency_signals');

  // Fetch all proficiency records for this user
  const { data: proficiencies, error: fetchError } = await supabase
    .from('user_metric_proficiency')
    .select('*')
    .eq('user_id', user_id);

  if (fetchError) {
    throw new Error(`Error fetching proficiencies: ${fetchError.message}`);
  }

  console.log(`📊 [Phase E] Processing ${proficiencies.length} proficiency records`);

  // Group by dimension_type
  const byType = {
    core_metric: proficiencies.filter(p => p.dimension_type === 'core_metric'),
    genre: proficiencies.filter(p => p.dimension_type === 'genre'),
    question_type: proficiencies.filter(p => p.dimension_type === 'question_type'),
  };

  // 1. Build genre_strengths JSON
  const genre_strengths: Record<string, number> = {};
  for (const g of byType.genre) {
    genre_strengths[g.dimension_key] = g.proficiency_score;
  }

  // 2. Find weak topics (bottom 3 genres by score)
  const weak_topics = byType.genre
    .sort((a, b) => a.proficiency_score - b.proficiency_score)
    .slice(0, 3)
    .map(g => g.dimension_key);

  // 3. Find weak question types
  const weak_question_types = byType.question_type
    .sort((a, b) => a.proficiency_score - b.proficiency_score)
    .slice(0, 3)
    .map(q => q.dimension_key);

  // 4. Map core metrics to specific skills
  const coreMetricMap: Record<string, string> = {
    'inference_accuracy': 'inference_skill',
    'tone_and_intent_sensitivity': 'tone_analysis_skill',
    'detail_vs_structure_balance': 'main_idea_skill',
    'evidence_evaluation': 'detail_comprehension_skill',
  };

  const skillScores: Record<string, number> = {};
  for (const cm of byType.core_metric) {
    const skillKey = coreMetricMap[cm.dimension_key];
    if (skillKey) {
      skillScores[skillKey] = cm.proficiency_score;
    }
  }

  // 5. Calculate overall proficiency (average of core metrics)
  const overall = byType.core_metric.length > 0
    ? Math.round(
        byType.core_metric.reduce((sum, cm) => sum + cm.proficiency_score, 0) /
        byType.core_metric.length
      )
    : null;

  // 6. Determine recommended difficulty
  let recommended_difficulty = 'medium';
  if (overall !== null) {
    if (overall >= 75) recommended_difficulty = 'hard';
    else if (overall >= 50) recommended_difficulty = 'medium';
    else recommended_difficulty = 'easy';
  }

  // 7. Prepare summary record
  const signalData = {
    user_id,
    overall_percentile: null, // TODO: requires population comparison
    estimated_cat_percentile: null, // TODO: requires calibration model
    genre_strengths: genre_strengths,
    inference_skill: skillScores['inference_skill'] || null,
    tone_analysis_skill: skillScores['tone_analysis_skill'] || null,
    main_idea_skill: skillScores['main_idea_skill'] || null,
    detail_comprehension_skill: skillScores['detail_comprehension_skill'] || null,
    recommended_difficulty,
    weak_topics,
    weak_question_types,
    calculated_at: new Date().toISOString(),
    data_points_count: proficiencies.length,
    updated_at: new Date().toISOString(),
  };

  // 8. Upsert into user_proficiency_signals
  const { error: upsertError } = await supabase
    .from('user_proficiency_signals')
    .upsert(signalData, {
      onConflict: 'user_id',
    });

  if (upsertError) {
    throw new Error(`Error upserting proficiency signals: ${upsertError.message}`);
  }

  console.log('✅ [Phase E] Proficiency signals updated successfully');
  console.log(`   - Overall: ${overall}`);
  console.log(`   - Recommended difficulty: ${recommended_difficulty}`);
  console.log(`   - Weak topics: ${weak_topics.join(', ') || 'none'}`);
}
