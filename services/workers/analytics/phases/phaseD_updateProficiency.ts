// VARC Analytics - Phase D: Update Proficiency

import type { UserMetricProficiency } from "../types";
import { calculateConfidence, calculateNewProficiency, calculateTrend } from "../utils/scoring";

export async function phaseD_updateProficiency(
    supabase: any,
    user_id: string,
    session_id: string,
    sessionMetrics: UserMetricProficiency[] // Data from Phase B
) {
    console.log('🧮 [Phase D] Updating user_metric_proficiency');

    let updateCount = 0;

    for (const incoming of sessionMetrics) {
        const { dimension_type, dimension_key } = incoming;

        // 1. Fetch existing proficiency record for this specific metric
        const { data: existing, error: fetchError } = await supabase
            .from('user_metric_proficiency')
            .select('*')
            .eq('user_id', user_id)
            .eq('dimension_type', dimension_type)
            .eq('dimension_key', dimension_key)
            .maybeSingle();

        if (fetchError) {
            console.error(`❌ [Phase D] Error fetching existing proficiency for ${dimension_type}:${dimension_key}:`, fetchError);
            continue;
        }

        // 2. Idempotence check: skip if already updated for this session
        if (existing && existing.last_session_id === session_id) {
            console.log(`⚠️ [Phase D] ${dimension_type}:${dimension_key} already updated for session ${session_id}, skipping`);
            continue;
        }

        // 3. Aggregate totals
        const totalAttempts = (existing?.total_attempts || 0) + incoming.total_attempts;
        const totalCorrect = (existing?.correct_attempts || 0) + incoming.correct_attempts;

        // 4. Calculate weighted confidence 
        // We use a helper that factors in the volume of data points (totalAttempts)
        const confidence = calculateConfidence(totalAttempts);

        // 5. Calculate new proficiency score
        // Uses Hybrid Bayesian-EMA approach (Calibration vs Growth)
        const oldProficiency = existing ? existing.proficiency_score : 50;
        const sessionProficiency = incoming.proficiency_score;

        const newProficiency = calculateNewProficiency(
            oldProficiency,
            sessionProficiency,
            totalAttempts,
            totalCorrect
        );

        // 6. Calculate trend ('improving', 'declining', 'stagnant')
        const trend = calculateTrend(oldProficiency, newProficiency);

        // 7. Prepare final record for database
        const updateData = {
            user_id,
            dimension_type,
            dimension_key,
            proficiency_score: newProficiency,
            confidence_score: confidence,
            total_attempts: totalAttempts,
            correct_attempts: totalCorrect,
            last_session_id: session_id,
            trend,
            updated_at: new Date().toISOString(),
        };

        // 8. Upsert into database
        // Your SQL schema has a unique constraint: (user_id, dimension_type, dimension_key)
        const { error: upsertError } = await supabase
            .from('user_metric_proficiency')
            .upsert(updateData, {
                onConflict: 'user_id,dimension_type,dimension_key',
            });

        if (upsertError) {
            console.error(`❌ [Phase D] Upsert failed for ${dimension_type}:${dimension_key}:`, upsertError);
            continue;
        }

        updateCount++;
    }

    console.log(`✅ [Phase D] Successfully processed ${updateCount} proficiency dimensions`);

    return {
        success: true,
        updates_performed: updateCount
    };
}