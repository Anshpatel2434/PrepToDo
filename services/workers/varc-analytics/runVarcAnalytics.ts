// VARC Analytics - Main Orchestrator

import { supabase } from "../../config/supabase";
import { phaseA_fetchSessionData } from "./phases/phaseA_fetchSessionData";
import { phaseB_computeSurfaceStats } from "./phases/phaseB_computeSurfaceStats";
import { phaseC_llmDiagnostics } from "./phases/phaseC_llmDiagnostics";
import { phaseD_updateProficiency } from "./phases/phaseD_updateProficiency";
import { phaseE_rollupSignals } from "./phases/phaseE_rollupSignals";
import { loadMetricMapping } from "./utils/mapping";
import type { AnalyticsResult } from "./types";

// Import mapping JSON
import metricMappingJson from "../../config/core_metric_reasoning_map_v1.0.json";

export async function runVarcAnalytics(params: {
  session_id: string;
  user_id: string;
}): Promise<AnalyticsResult> {

  const { session_id, user_id } = params;

  console.log("🚀 [START] VARC Analytics session analysis");
  console.log(`   Session ID: ${session_id}`);
  console.log(`   User ID: ${user_id}`);

  try {

    // --- PHASE A: DATA COLLECTION ---
    console.log("\n📥 [Phase A/5] Fetching session data");
    const phaseAResult = await phaseA_fetchSessionData(supabase, session_id, user_id);

    // Check if already analysed
    if (phaseAResult.alreadyAnalysed) {
      console.log("✅ [COMPLETE] Session already analysed, no action needed");
      return { success: true, message: "Already analysed" };
    }

    const { dataset, session } = phaseAResult;
    console.log(`   - Dataset size: ${dataset.length} attempts`);

    if (dataset.length === 0) {
      console.log("⚠️ No attempts to process, marking as analysed");
      // Still mark as analysed even if empty to avoid reprocessing
      const { error: finalError } = await supabase
        .from('practice_sessions')
        .update({
          is_analysed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session_id);

      if (finalError) {
        throw new Error(`Failed to mark session as analysed: ${finalError.message}`);
      }
      return { success: true, session_id, user_id, stats: { total_attempts: 0, correct_attempts: 0, dimensions_updated: { core_metrics: 0, genres: 0, question_types: 0 } } };
    }

    // Load metric mapping
    const metricMapping = loadMetricMapping(metricMappingJson);
    console.log(`   - Loaded mapping: ${metricMapping.metricToNodes.size} metrics`);

    // --- PHASE B: QUANTITATIVE AGGREGATION ---
    console.log("\n📊 [Phase B/5] Computing surface statistics");
    const surfaceStats = phaseB_computeSurfaceStats(dataset, metricMapping.nodeToMetrics);

    // --- PHASE C: LLM DIAGNOSTICS ---
    console.log("\n🧠 [Phase C/5] Running LLM diagnostics on incorrect attempts");
    const incorrectAttempts = dataset.filter(a => !a.correct);
    console.log(`   - Incorrect attempts: ${incorrectAttempts.length}`);

    const diagnostics = await phaseC_llmDiagnostics(incorrectAttempts);

    // Store diagnostics in session_data
    if (diagnostics.diagnostics.length > 0) {
      const { error: diagError } = await supabase
        .from('practice_sessions')
        .update({
          session_data: {
            ...(session.session_data || {}),
            varc_analytics: {
              version: 'v1.0',
              analyzed_at: new Date().toISOString(),
              diagnostics: diagnostics.diagnostics,
            }
          }
        })
        .eq('id', session_id);

      if (diagError) {
        console.error('⚠️ [Phase C] Failed to store diagnostics:', diagError.message);
        // Don't fail pipeline
      } else {
        console.log('   - Diagnostics stored in session_data');
      }
    }

    // --- PHASE D: PROFICIENCY ENGINE ---
    console.log("\n🧮 [Phase D/5] Updating atomic proficiency scores");
    await phaseD_updateProficiency(supabase, user_id, session_id, surfaceStats);

    // --- PHASE E: SUMMARY ROLLUP ---
    console.log("\n📦 [Phase E/5] Rolling up proficiency signals");
    await phaseE_rollupSignals(supabase, user_id);

    // --- FINALIZATION: MARK AS ANALYSED ---
    console.log("\n🔒 [Finalization] Marking session as analysed");
    const { error: finalError } = await supabase
      .from('practice_sessions')
      .update({
        is_analysed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (finalError) {
      throw new Error(`Failed to mark session as analysed: ${finalError.message}`);
    }

    console.log("\n✅ [COMPLETE] VARC Analytics finished successfully");
    console.log(`   - Total attempts processed: ${dataset.length}`);
    console.log(`   - Core metrics updated: ${surfaceStats.core_metric.size}`);
    console.log(`   - Genres updated: ${surfaceStats.genre.size}`);
    console.log(`   - Question types updated: ${surfaceStats.question_type.size}`);

    return {
      success: true,
      session_id,
      user_id,
      stats: {
        total_attempts: dataset.length,
        correct_attempts: dataset.filter(a => a.correct).length,
        dimensions_updated: {
          core_metrics: surfaceStats.core_metric.size,
          genres: surfaceStats.genre.size,
          question_types: surfaceStats.question_type.size,
        }
      }
    };

  } catch (error) {
    console.error("\n❌ [ERROR] VARC Analytics failed:");
    console.error(error);
    throw error;
  }
}
