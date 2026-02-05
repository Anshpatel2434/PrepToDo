// VARC Analytics - Main Orchestrator
// Refactored for Drizzle

import { metricMappingJson } from "../../config/core_metric_reasoning_map_v1_0";
import { phaseA_fetchSessionData } from "./phases/phaseA_fetchSessionData";
import { phaseB_computeProficiencyMetrics } from "./phases/phaseB_computeProficiencyMetrics";
import { phaseC_llmDiagnostics } from "./phases/phaseC_llmDiagnostics";
import { phaseD_updateProficiency } from "./phases/phaseD_updateProficiency";
import { phaseE_rollupSignals } from "./phases/phaseE_rollupSignals";
import { phaseF_updateUserAnalytics } from "./phases/phaseF_updateUserAnalytics";
import { AnalyticsResult } from "./types";
import { loadMetricMapping } from "./utils/mapping";
import { db } from "../../db";
import { practiceSessions } from "../../db/schema";
import { and, eq } from "drizzle-orm";

export async function runAnalytics(params: {
    user_id: string;
}): Promise<AnalyticsResult> {

    const { user_id } = params;

    console.log("🚀 [START] VARC Analytics - Processing user sessions");
    console.log(`   User ID: ${user_id}`);

    try {
        // Fetch all unanalyzed sessions for this user
        console.log("\n📥 Fetching unanalyzed sessions for user");

        const unanalyzedSessions = await db.query.practiceSessions.findMany({
            where: and(
                eq(practiceSessions.user_id, user_id),
                eq(practiceSessions.is_analysed, false),
                eq(practiceSessions.status, 'completed')
            ),
            orderBy: (sessions, { asc }) => [asc(sessions.completed_at)],
            columns: {
                id: true,
                completed_at: true,
            }
        });

        if (!unanalyzedSessions || unanalyzedSessions.length === 0) {
            console.log("✅ No unanalyzed sessions found");
            // Still update streaks even if no sessions (day change scenario)
            await phaseF_updateUserAnalytics(user_id, null, [], {
                time_spent_seconds: 0,
                points_earned: 0,
                completed_at: new Date().toISOString(), // Just for date extraction
            });

            return {
                success: true,
                message: "No sessions to analyze, streaks updated",
                user_id,
                stats: {
                    total_attempts: 0,
                    correct_attempts: 0,
                    dimensions_updated: {
                        core_metrics: 0,
                        genres: 0,
                        question_types: 0,
                    },
                },
            };
        }

        console.log(`📊 Found ${unanalyzedSessions.length} unanalyzed session(s) to process`);

        // Load metric mapping once for all sessions
        const metricMapping = loadMetricMapping(metricMappingJson);
        console.log(`   - Loaded mapping: ${metricMapping.metricToNodes.size} metrics`);

        // Track overall stats
        let totalAttempts = 0;
        let totalCorrect = 0;
        let totalCoreMetrics = 0;
        let totalGenres = 0;
        let totalQuestionTypes = 0;

        // Process each session
        for (let i = 0; i < unanalyzedSessions.length; i++) {
            const sessionRecord = unanalyzedSessions[i];
            const session_id = sessionRecord.id;

            console.log(`\n${'='.repeat(60)}`);
            console.log(`📝 Processing session ${i + 1}/${unanalyzedSessions.length}`);
            console.log(`   Session ID: ${session_id}`);
            console.log(`${'='.repeat(60)}`);

            try {
                // --- PHASE A: DATA COLLECTION ---
                console.log("\n📥 [Phase A/6] Fetching session data");
                const phaseAResult = await phaseA_fetchSessionData(session_id, user_id);

                // Check if already analysed (race condition guard)
                if (phaseAResult.alreadyAnalysed) {
                    console.log("⚠️ Session already analysed, skipping");
                    continue;
                }

                const { dataset, session } = phaseAResult;
                console.log(`   - Dataset size: ${dataset.length} attempts`);

                if (dataset.length === 0) {
                    console.log("⚠️ No attempts to process, marking as analysed");
                    await db.update(practiceSessions)
                        .set({ is_analysed: true, updated_at: new Date() })
                        .where(eq(practiceSessions.id, session_id));
                    continue;
                }

                // --- PHASE B: QUANTITATIVE AGGREGATION ---
                console.log("\n📊 [Phase B/6] Computing surface statistics");
                // Note: session_id in phase B is mostly for tagging the updates
                const sessionMetrics = phaseB_computeProficiencyMetrics(user_id, session_id, dataset, metricMapping);

                // --- PHASE C: LLM DIAGNOSTICS ---
                console.log("\n🧠 [Phase C/6] Running LLM diagnostics on incorrect attempts");
                const incorrectAttempts = dataset.filter(a => (!a.correct && a.user_answer?.user_answer));
                console.log(`   - Incorrect attempts: ${incorrectAttempts.length}`);

                const diagnostics = await phaseC_llmDiagnostics(user_id, incorrectAttempts);

                // Store diagnostics in session_data
                if (diagnostics.diagnostics.length > 0) {
                    // We need to fetch current sessionData/analytics first because Drizzle updates are overwrites usually unless we use jsonb_set logic, 
                    // but simple way is fetch-modify-save or just merge if we know the structure.
                    // PracticeSessionSchema says `analytics` is the field for diagnostics? 
                    // No, `analytics` column in schema is `text('analytics')`.
                    // The original code updated `analytics: { ...analyics, diagnostics }`.

                    const existingAnalytics = typeof session.analytics === 'string'
                        ? JSON.parse(session.analytics)
                        : session.analytics || {};

                    const newAnalytics = {
                        ...existingAnalytics,
                        version: 'v1.0',
                        analyzed_at: new Date().toISOString(),
                        diagnostics: diagnostics.diagnostics,
                    };

                    await db.update(practiceSessions)
                        .set({ analytics: JSON.stringify(newAnalytics) })
                        .where(eq(practiceSessions.id, session_id));

                    console.log('   - Diagnostics stored in session analytics');
                }

                // --- PHASE D: PROFICIENCY ENGINE ---
                console.log("\n🧮 [Phase D/6] Updating atomic proficiency scores");
                await phaseD_updateProficiency(user_id, session_id, sessionMetrics);

                // --- PHASE E: SUMMARY ROLLUP ---
                console.log("\n📦 [Phase E/6] Rolling up proficiency signals");
                await phaseE_rollupSignals(user_id);

                // --- PHASE F: USER ANALYTICS ---
                console.log("\n📊 [Phase F/6] Updating user analytics");
                await phaseF_updateUserAnalytics(user_id, session_id, dataset, {
                    time_spent_seconds: session.time_spent_seconds,
                    points_earned: session.points_earned,
                    completed_at: session.completed_at,
                });

                // --- FINALIZATION: MARK AS ANALYSED ---
                console.log("\n🔒 [Finalization] Marking session as analysed");
                await db.update(practiceSessions)
                    .set({ is_analysed: true, updated_at: new Date() })
                    .where(eq(practiceSessions.id, session_id));

                // Helper to count updated unique dimensions for the log
                const getCount = (type: string) => sessionMetrics.filter(m => m.dimension_type === type).length;

                console.log("\n✅ Session analysis complete");
                console.log(`   - Total attempts processed: ${dataset.length}`);
                console.log(`   - Core metrics updated: ${getCount('core_metric')}`);
                console.log(`   - Genres updated: ${getCount('genre')}`);
                console.log(`   - Question types updated: ${getCount('question_type')}`);

                // Accumulate stats
                totalAttempts += dataset.length;
                totalCorrect += dataset.filter(a => a.correct).length;
                totalCoreMetrics += getCount('core_metric');
                totalGenres += getCount('genre');
                totalQuestionTypes += getCount('question_type');

            } catch (sessionError) {
                console.error(`\n❌ [ERROR] Failed to process session ${session_id}:`, sessionError);
                // Continue processing other sessions
                continue;
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log("✅ [COMPLETE] VARC Analytics finished for all sessions");
        console.log(`   - Sessions processed: ${unanalyzedSessions.length}`);
        console.log(`   - Total attempts: ${totalAttempts}`);
        console.log(`   - Correct attempts: ${totalCorrect}`);
        console.log(`   - Core metrics updated: ${totalCoreMetrics}`);
        console.log(`   - Genres updated: ${totalGenres}`);
        console.log(`   - Question types updated: ${totalQuestionTypes}`);
        console.log(`${'='.repeat(60)}`);

        return {
            success: true,
            user_id,
            stats: {
                total_attempts: totalAttempts,
                correct_attempts: totalCorrect,
                dimensions_updated: {
                    core_metrics: totalCoreMetrics,
                    genres: totalGenres,
                    question_types: totalQuestionTypes,
                },
            },
        };

    } catch (error: any) {
        console.error("\n❌ [ERROR] VARC Analytics failed:");
        console.error(error);
        throw error;
    }
}
