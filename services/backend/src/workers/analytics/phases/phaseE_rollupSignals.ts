// VARC Analytics - Phase E: Rollup Signals
// Refactored for Drizzle

import type { UserProficiencySignals } from "../types";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../../db";
import { userMetricProficiency, userProficiencySignals } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger('analytics-phase-e');

export async function phaseE_rollupSignals(
    user_id: string
) {
    logger.info('Rolling up user_proficiency_signals');

    // 1. Fetch all proficiency records for this user
    const proficiencies = await db.query.userMetricProficiency.findMany({
        where: eq(userMetricProficiency.user_id, user_id)
    });

    logger.info({ count: proficiencies.length }, "Processing proficiency records");

    // 2. Group by dimension_type
    const byType = {
        core_metric: proficiencies.filter(p => p.dimension_type === 'core_metric'),
        genre: proficiencies.filter(p => p.dimension_type === 'genre'),
        question_type: proficiencies.filter(p => p.dimension_type === 'question_type'),
    };

    // 3. Build genre_strengths ARRAY
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
    const signalData = {
        user_id,
        genre_strengths: JSON.stringify(genre_strengths), // Keep as JSON string for now as schema says 'text'
        weak_topics: weak_topics, // Pass as array, let Drizzle handle it (if schema is updated)
        weak_question_types: weak_question_types, // Pass as array
        recommended_difficulty: recommended_difficulty,
        calculated_at: new Date(),
        data_points_count: proficiencies.length,
        updated_at: new Date(),
    };

    // 9. Upsert into user_proficiency_signals
    try {
        await db.insert(userProficiencySignals)
            .values(signalData)
            .onConflictDoUpdate({
                target: [userProficiencySignals.user_id],
                set: signalData
            });
    } catch (upsertError: any) {
        logger.error({ error: upsertError instanceof Error ? upsertError.message : String(upsertError), userId: user_id }, 'Failed to upsert user_proficiency_signals');
        throw new Error(`Error upserting proficiency signals: ${upsertError.message}`);
    }

    logger.info({
        dataPoints: proficiencies.length,
        recommendedDifficulty: recommended_difficulty
    }, 'Proficiency signals updated successfully');
}
