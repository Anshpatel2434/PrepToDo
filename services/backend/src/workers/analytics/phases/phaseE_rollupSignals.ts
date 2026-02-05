// VARC Analytics - Phase E: Rollup Signals
// Refactored for Drizzle

import type { UserProficiencySignals } from "../types";
import { db } from "../../../db";
import { userMetricProficiency, userProficiencySignals } from "../../../db/schema";
import { eq } from "drizzle-orm";

export async function phaseE_rollupSignals(
    user_id: string
) {
    console.log('📦 [Phase E] Rolling up user_proficiency_signals');

    // 1. Fetch all proficiency records for this user
    const proficiencies = await db.query.userMetricProficiency.findMany({
        where: eq(userMetricProficiency.userId, user_id)
    });

    console.log(`📊 [Phase E] Processing ${proficiencies.length} proficiency records`);

    // 2. Group by dimension_type
    const byType = {
        core_metric: proficiencies.filter(p => p.dimensionType === 'core_metric'),
        genre: proficiencies.filter(p => p.dimensionType === 'genre'),
        question_type: proficiencies.filter(p => p.dimensionType === 'question_type'),
    };

    // 3. Build genre_strengths ARRAY
    const genre_strengths = byType.genre.map(g => ({
        genre: g.dimensionKey,
        score: g.proficiencyScore
    }));

    // 4. Find weak topics (bottom 3 genres by score)
    const weak_topics = byType.genre
        .sort((a, b) => a.proficiencyScore - b.proficiencyScore)
        .slice(0, 3)
        .map(g => g.dimensionKey);

    // 5. Find weak question types
    const weak_question_types = byType.question_type
        .sort((a, b) => a.proficiencyScore - b.proficiencyScore)
        .slice(0, 3)
        .map(q => q.dimensionKey);

    // 6. Calculate overall proficiency (average of core metrics) for logic
    const overallScore = byType.core_metric.length > 0
        ? Math.round(
            byType.core_metric.reduce((sum, cm) => sum + cm.proficiencyScore, 0) /
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
    const signalData = {
        userId: user_id,
        genreStrengths: JSON.stringify(genre_strengths), // Keep as JSON string for now as schema says 'text'
        weakTopics: weak_topics, // Pass as array, let Drizzle handle it (if schema is updated)
        weakQuestionTypes: weak_question_types, // Pass as array
        recommendedDifficulty: recommended_difficulty,
        calculatedAt: new Date(),
        dataPointsCount: proficiencies.length,
        updatedAt: new Date(),
    };

    // 9. Upsert into user_proficiency_signals
    try {
        await db.insert(userProficiencySignals)
            .values(signalData)
            .onConflictDoUpdate({
                target: [userProficiencySignals.userId],
                set: signalData
            });
    } catch (upsertError: any) {
        throw new Error(`Error upserting proficiency signals: ${upsertError.message}`);
    }

    console.log('✅ [Phase E] Proficiency signals updated successfully');
    console.log(`   - Data Points: ${proficiencies.length}`);
    console.log(`   - Recommended Difficulty: ${recommended_difficulty}`);
}
