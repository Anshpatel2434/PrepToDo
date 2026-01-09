// VARC Analytics - Phase E: Rollup Signals

import type { UserProficiencySignals } from "../types";

export async function phaseE_rollupSignals(
    supabase: any,
    user_id: string
) {
    console.log('📦 [Phase E] Rolling up user_proficiency_signals');

    // 1. Fetch all proficiency records for this user
    const { data: proficiencies, error: fetchError } = await supabase
        .from('user_metric_proficiency')
        .select('*')
        .eq('user_id', user_id);

    if (fetchError) {
        throw new Error(`Error fetching proficiencies: ${fetchError.message}`);
    }

    console.log(`📊 [Phase E] Processing ${proficiencies.length} proficiency records`);

    // 2. Group by dimension_type
    const byType = {
        core_metric: proficiencies.filter(p => p.dimension_type === 'core_metric'),
        genre: proficiencies.filter(p => p.dimension_type === 'genre'),
        question_type: proficiencies.filter(p => p.dimension_type === 'question_type'),
    };

    // 3. Build genre_strengths ARRAY (Matching your updated Schema: z.array(z.any()))
    // We convert the map into an array of { genre: string, score: number }
    const genre_strengths = byType.genre.map(g => ({
        genre: g.dimension_key,
        score: g.proficiency_score
    }));

    // 4. Find weak topics (bottom 3 genres by score)
    const weak_topics = byType.genre
        .sort((a, b) => a.proficiency_score - b.proficiency_score)
        .slice(0, 3)
        .map(g => g.dimension_key);

    // 5. Find weak question types
    const weak_question_types = byType.question_type
        .sort((a, b) => a.proficiency_score - b.proficiency_score)
        .slice(0, 3)
        .map(q => q.dimension_key);

    // 6. Calculate overall proficiency (average of core metrics) for logic
    const overallScore = byType.core_metric.length > 0
        ? Math.round(
            byType.core_metric.reduce((sum, cm) => sum + cm.proficiency_score, 0) /
            byType.core_metric.length
        )
        : null;

    // 7. Determine recommended difficulty
    let recommended_difficulty = 'medium';
    if (overallScore !== null) {
        if (overallScore >= 75) recommended_difficulty = 'hard';
        else if (overallScore >= 45) recommended_difficulty = 'medium';
        else recommended_difficulty = 'easy';
    }

    // 8. Prepare summary record matching UserProficiencySignalsSchema
    // Note: Skill scores are omitted as they were commented out in your schema
    const signalData: Partial<UserProficiencySignals> = {
        user_id,
        overall_percentile: null, // Placeholder for future population comparison
        estimated_cat_percentile: null, // Placeholder for calibration
        genre_strengths: genre_strengths, // Now an Array
        recommended_difficulty,
        weak_topics,
        weak_question_types,
        calculated_at: new Date().toISOString(),
        data_points_count: proficiencies.length,
        updated_at: new Date().toISOString(),
    };

    // 9. Upsert into user_proficiency_signals
    const { error: upsertError } = await supabase
        .from('user_proficiency_signals')
        .upsert(signalData, {
            onConflict: 'user_id',
        });

    if (upsertError) {
        throw new Error(`Error upserting proficiency signals: ${upsertError.message}`);
    }

    console.log('✅ [Phase E] Proficiency signals updated successfully');
    console.log(`   - Data Points: ${proficiencies.length}`);
    console.log(`   - Recommended Difficulty: ${recommended_difficulty}`);
}