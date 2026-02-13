// VARC Analytics - Main Orchestrator
// Refactored for Drizzle

import { metricMappingJson } from "../../config/core_metric_reasoning_map_v1_0";
import { phaseA_fetchSessionData } from "./phases/phaseA_fetchSessionData";
import { phaseB_computeProficiencyMetrics } from "./phases/phaseB_computeProficiencyMetrics";
import { phaseD_updateProficiency } from "./phases/phaseD_updateProficiency";
import { phaseE_rollupSignals } from "./phases/phaseE_rollupSignals";
import { phaseF_updateUserAnalytics } from "./phases/phaseF_updateUserAnalytics";
import { AnalyticsResult } from "./types";
import { loadMetricMapping } from "./utils/mapping";
import { db } from "../../db";
import { practiceSessions } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { createChildLogger } from "../../common/utils/logger.js";
import { CostTracker } from "../../common/utils/CostTracker";

const logger = createChildLogger('analytics-worker');

export async function runAnalytics(params: {
    user_id: string;
}): Promise<AnalyticsResult> {

    const { user_id } = params;

    logger.info({ user_id }, "VARC Analytics Processing started");

    try {
        // Initialize Cost Tracker
        const costTracker = new CostTracker();
        logger.info("💰 [CostTracker] Initialized for monitoring AI costs");
        // Fetch all unanalyzed sessions for this user
        logger.info("Fetching unanalyzed sessions");

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
            logger.info("No unanalyzed sessions found");
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

        logger.info({ count: unanalyzedSessions.length }, "Found unanalyzed sessions");

        // Load metric mapping once for all sessions
        const metricMapping = loadMetricMapping(metricMappingJson);
        logger.info({ mappingSize: metricMapping.metricToNodes.size }, "Loaded metric mapping");

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

            logger.info({
                index: i + 1,
                total: unanalyzedSessions.length,
                sessionId: session_id
            }, "Processing session");

            try {
                // --- PHASE A: DATA COLLECTION ---
                logger.info(`[Phase ${String.fromCharCode(65 + i)}/6] Processing`);
                const phaseAResult = await phaseA_fetchSessionData(session_id, user_id);

                // Check if already analysed (race condition guard)
                if (phaseAResult.alreadyAnalysed) {
                    console.log("⚠️ Session already analysed, skipping");
                    continue;
                }

                const { dataset, session } = phaseAResult;
                logger.info({ datasetSize: dataset.length }, "Fetched session data");

                if (dataset.length === 0) {
                    logger.info("No attempts to process, marking as analysed");
                    await db.update(practiceSessions)
                        .set({ is_analysed: true, updated_at: new Date() })
                        .where(eq(practiceSessions.id, session_id));
                    continue;
                }

                // --- PHASE B: QUANTITATIVE AGGREGATION ---
                console.log("\n📊 [Phase B/6] Computing surface statistics");
                // Note: session_id in phase B is mostly for tagging the updates
                const sessionMetrics = phaseB_computeProficiencyMetrics(user_id, session_id, dataset, metricMapping);

                // Note: Phase C (LLM Diagnostics) has been removed from the pipeline.
                // AI insights are now generated on-demand via POST /api/ai-insights/generate

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

                const getCount = (type: string) => sessionMetrics.filter(m => m.dimension_type === type).length;

                logger.info({
                    attempts: dataset.length,
                    coreMetrics: getCount('core_metric'),
                    genres: getCount('genre'),
                    questionTypes: getCount('question_type')
                }, "Session analysis complete");

                // Accumulate stats
                totalAttempts += dataset.length;
                totalCorrect += dataset.filter(a => a.correct).length;
                totalCoreMetrics += getCount('core_metric');
                totalGenres += getCount('genre');
                totalQuestionTypes += getCount('question_type');

            } catch (sessionError) {
                logger.error({ error: sessionError instanceof Error ? sessionError.message : String(sessionError), sessionId: session_id }, "Failed to process session");
                // Continue processing other sessions
                continue;
            }
        }

        logger.info({
            sessionsProcessed: unanalyzedSessions.length,
            totalAttempts,
            totalCorrect,
            totalCoreMetrics,
            totalGenres,
            totalQuestionTypes
        }, "VARC Analytics finished for all sessions");

        // Print and persist cost tracking report
        costTracker.printReport();
        await costTracker.persistToDb('analytics', user_id);

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
        logger.error({ error: error instanceof Error ? error.message : String(error) }, "VARC Analytics failed");
        throw error;
    }
}
