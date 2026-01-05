// VARC Analytics - Phase D: Update Proficiency

import type { SurfaceStats } from "../types";
import { calculateConfidence, calculateNewProficiency, calculateTrend } from "../utils/scoring";

export async function phaseD_updateProficiency(
  supabase: any,
  user_id: string,
  session_id: string,
  surfaceStats: SurfaceStats
) {

  console.log('🧮 [Phase D] Updating user_metric_proficiency');

  // Process each dimension type
  const dimensionTypes = [
    { type: 'core_metric', statsMap: surfaceStats.core_metric },
    { type: 'genre', statsMap: surfaceStats.genre },
    { type: 'question_type', statsMap: surfaceStats.question_type },
    { type: 'reasoning_step', statsMap: surfaceStats.reasoning_step },
  ];

  let updateCount = 0;

  for (const { type, statsMap } of dimensionTypes) {

    for (const [dimensionKey, stats] of statsMap.entries()) {

      // Fetch existing proficiency record
      const { data: existing, error: fetchError } = await supabase
        .from('user_metric_proficiency')
        .select('*')
        .eq('user_id', user_id)
        .eq('dimension_type', type)
        .eq('dimension_key', dimensionKey)
        .maybeSingle();

      if (fetchError) {
        console.error(`❌ [Phase D] Error fetching proficiency for ${type}:${dimensionKey}:`, fetchError);
        continue;
      }

      // Idempotence check: skip if already updated for this session
      if (existing && existing.last_session_id === session_id) {
        console.log(`⚠️ [Phase D] ${type}:${dimensionKey} already updated for this session, skipping`);
        continue;
      }

      // Calculate confidence
      const totalAttempts = existing
        ? existing.total_attempts + stats.attempts
        : stats.attempts;

      const confidence = calculateConfidence(totalAttempts);

      // Calculate new proficiency
      const oldProficiency = existing ? existing.proficiency_score : 50; // Default 50 for new
      const newProficiency = calculateNewProficiency(
        oldProficiency,
        stats.score_0_100,
        confidence
      );

      // Calculate trend
      const trend = calculateTrend(oldProficiency, newProficiency);

      // Prepare update data
      const updateData = {
        user_id,
        dimension_type: type,
        dimension_key: dimensionKey,
        proficiency_score: newProficiency,
        confidence_score: confidence,
        total_attempts: totalAttempts,
        correct_attempts: (existing?.correct_attempts || 0) + stats.correct,
        last_session_id: session_id,
        trend,
        updated_at: new Date().toISOString(),
      };

      // Check if we can use upsert (unique constraint may not exist)
      // Try upsert first
      const { error: upsertError } = await supabase
        .from('user_metric_proficiency')
        .upsert(updateData, {
          onConflict: 'user_id,dimension_type,dimension_key',
        });

      if (upsertError) {
        // If upsert fails, try insert or update
        if (existing) {
          // Update existing
          const { error: updateError } = await supabase
            .from('user_metric_proficiency')
            .update(updateData)
            .eq('id', existing.id);

          if (updateError) {
            console.error(`❌ [Phase D] Error updating proficiency for ${type}:${dimensionKey}:`, updateError);
            continue;
          }
        } else {
          // Insert new
          const { error: insertError } = await supabase
            .from('user_metric_proficiency')
            .insert([updateData]);

          if (insertError) {
            console.error(`❌ [Phase D] Error inserting proficiency for ${type}:${dimensionKey}:`, insertError);
            continue;
          }
        }
      }

      updateCount++;
    }
  }

  console.log(`✅ [Phase D] Updated ${updateCount} proficiency records`);
}
