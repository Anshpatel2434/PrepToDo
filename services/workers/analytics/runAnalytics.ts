// VARC Analytics - Main Orchestrator

// Import mapping JSON
import { metricMappingJson } from "../../config/core_metric_reasoning_map_v1_0";
import { supabase } from "../../config/supabase";
import { phaseA_fetchSessionData } from "./phases/phaseA_fetchSessionData";
import { phaseB_computeProficiencyMetrics } from "./phases/phaseB_computeProficiencyMetrics";
import { phaseC_llmDiagnostics } from "./phases/phaseC_llmDiagnostics";
import { phaseD_updateProficiency } from "./phases/phaseD_updateProficiency";
import { phaseE_rollupSignals } from "./phases/phaseE_rollupSignals";
import { phaseF_updateUserAnalytics } from "./phases/phaseF_updateUserAnalytics";
import { AnalyticsResult } from "./types";
import { loadMetricMapping } from "./utils/mapping";

export async function runAnalytics(params: {
    session_id: string;
    user_id: string;
}): Promise<AnalyticsResult> {

    const { session_id, user_id } = params;

    console.log("🚀 [START] VARC Analytics session analysis");
    console.log(`   Session ID: ${session_id}`);
    console.log(`   User ID: ${user_id}`);

    try {

        // --- PHASE A: DATA COLLECTION ---
        console.log("\n📥 [Phase A/6] Fetching session data");
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
        console.log("\n📊 [Phase B/6] Computing surface statistics");
        const sessionMetrics = phaseB_computeProficiencyMetrics(user_id, session_id, dataset, metricMapping,);

        // --- PHASE C: LLM DIAGNOSTICS ---
        console.log("\n🧠 [Phase C/6] Running LLM diagnostics on incorrect attempts");
        const incorrectAttempts = dataset.filter(a => !a.correct);
        console.log(`   - Incorrect attempts: ${incorrectAttempts.length}`);

        const diagnostics = await phaseC_llmDiagnostics(incorrectAttempts);

        // Store diagnostics in session_data
        if (diagnostics.diagnostics.length > 0) {
            const { error: diagError } = await supabase
                .from('practice_sessions')
                .update({
                    analytics: {
                        ...(session.session_data || {}),
                        analytics: {
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
        console.log("\n🧮 [Phase D/6] Updating atomic proficiency scores");
        await phaseD_updateProficiency(supabase, user_id, session_id, sessionMetrics);

        // --- PHASE E: SUMMARY ROLLUP ---
        console.log("\n📦 [Phase E/6] Rolling up proficiency signals");
        await phaseE_rollupSignals(supabase, user_id);

        // --- PHASE F: USER ANALYTICS ---
        console.log("\n📊 [Phase F/6] Updating user analytics");
        await phaseF_updateUserAnalytics(supabase, user_id, session_id, dataset, {
            time_spent_seconds: session.time_spent_seconds,
            points_earned: session.points_earned,
            completed_at: session.completed_at,
        });

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

        // Helper to count updated unique dimensions for the log
        const getCount = (type: string) => sessionMetrics.filter(m => m.dimension_type === type).length;

        console.log("\n✅ [COMPLETE] VARC Analytics finished successfully");
        console.log(`   - Total attempts processed: ${dataset.length}`);
        console.log(`   - Core metrics updated: ${getCount('core_metric')}`);
        console.log(`   - Genres updated: ${getCount('genre')}`);
        console.log(`   - Question types updated: ${getCount('question_type')}`);

        return {
            success: true,
            session_id,
            user_id,
            stats: {
                total_attempts: dataset.length,
                correct_attempts: dataset.filter(a => a.correct).length,
                dimensions_updated: {
                    core_metrics: getCount('core_metric'),
                    genres: getCount('genre'),
                    question_types: getCount('question_type'),
                }
            }
        };

    } catch (error) {
        console.error("\n❌ [ERROR] VARC Analytics failed:");
        console.error(error);
        throw error;
    }
}