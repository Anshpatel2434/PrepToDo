// VARC Analytics - Phase D: Update Proficiency
// Refactored for Drizzle

import type { UserMetricProficiency } from "../types";
import { calculateConfidence, calculateNewProficiency, calculateTrend } from "../utils/scoring";
import { db } from "../../../db";
import { userMetricProficiency } from "../../../db/schema";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

export async function phaseD_updateProficiency(
    user_id: string,
    session_id: string,
    sessionMetrics: UserMetricProficiency[] // Data from Phase B
) {
    console.log('🧮 [Phase D] Updating user_metric_proficiency');

    let updateCount = 0;

    for (const incoming of sessionMetrics) {
        const { dimension_type, dimension_key } = incoming;

        // 1. Fetch existing proficiency record for this specific metric
        const existing = await db.query.userMetricProficiency.findFirst({
            where: and(
                eq(userMetricProficiency.user_id, user_id),
                eq(userMetricProficiency.dimension_type, dimension_type),
                eq(userMetricProficiency.dimension_key, dimension_key)
            )
        });

        // 2. Idempotence check: skip if already updated for this session
        if (existing && existing.last_session_id === session_id) {
            console.log(`⚠️ [Phase D] ${dimension_type}:${dimension_key} already updated for session ${session_id}, skipping`);
            continue;
        }

        // 3. Aggregate totals
        const totalAttempts = (existing?.total_attempts || 0) + incoming.total_attempts;
        const correctAttempts = (existing?.correct_attempts || 0) + incoming.correct_attempts;

        // 4. Calculate weighted confidence 
        const confidence = calculateConfidence(totalAttempts);

        // 5. Calculate new proficiency score
        const oldProficiency = existing ? existing.proficiency_score : 50;
        const sessionProficiency = incoming.proficiency_score;

        const newProficiency = calculateNewProficiency(
            oldProficiency,
            sessionProficiency,
            totalAttempts,
            correctAttempts
        );

        // 6. Calculate trend
        const trend = calculateTrend(oldProficiency, newProficiency);

        // 7. Prepare final record for database
        const updateData = {
            user_id: user_id,
            dimension_type: dimension_type,
            dimension_key: dimension_key,
            proficiency_score: newProficiency,
            confidence_score: confidence.toFixed(2), // Keep as number with 2 decimal places
            total_attempts: totalAttempts,
            correct_attempts: correctAttempts,
            last_session_id: session_id,
            trend,
            updated_at: new Date(),
            // Ensure createdAt is preserved or set
            created_at: existing?.created_at || new Date(),
            // Preserve speedVsAccuracyData if it exists (for reading speed metric mostly, but good practice)
            speed_vs_accuracy_data: existing?.speed_vs_accuracy_data,
            id: existing?.id || uuidv4(),
        };

        // 8. Upsert into database
        // Target: (user_id, dimension_type, dimension_key) which corresponds to the unique constraint
        try {
            await db.insert(userMetricProficiency)
                .values(updateData)
                .onConflictDoUpdate({
                    target: [userMetricProficiency.user_id, userMetricProficiency.dimension_type, userMetricProficiency.dimension_key],
                    set: updateData
                });

            updateCount++;
        } catch (upsertError) {
            console.error(`❌ [Phase D] Upsert failed for ${dimension_type}:${dimension_key}:`, upsertError);
            continue;
        }
    }

    console.log(`✅ [Phase D] Successfully processed ${updateCount} proficiency dimensions`);

    return {
        success: true,
        updates_performed: updateCount
    };
}
