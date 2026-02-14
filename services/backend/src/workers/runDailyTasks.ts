import { createChildLogger } from "../common/utils/logger";
import { runDailyContent } from "./daily-content/runDailyContent";
import { updateGlobalAnalytics } from "./analytics/updateGlobalAnalytics";

const logger = createChildLogger('daily-tasks');

/**
 * Orchestrator for all daily maintenance tasks.
 * 1. Generate Daily Content (Questions/Passages)
 * 2. Update Global Analytics (Streaks/Leaderboards)
 */
export async function runDailyTasks(skipGeneration = false) {
    logger.info("🚀 [Daily Tasks] Starting daily maintenance sequence");

    const results: any = {};

    try {
        // Step 1: Generate Daily Content
        if (!skipGeneration) {
            logger.info("📝 [Step 1/2] Generating Daily Content...");
            try {
                results.contentGeneration = await runDailyContent();
                logger.info("✅ [Step 1/2] Daily Content Generation Complete");
            } catch (err) {
                logger.error({ error: err }, "❌ [Step 1/2] Daily Content Generation Failed");
                results.contentGeneration = { success: false, error: err };
                // We continue to step 2 even if step 1 fails, as they are independent
            }
        } else {
            logger.info("⏭️ [Step 1/2] Skipping Daily Content Generation (Requested via flag)");
            results.contentGeneration = { skipped: true };
        }

        // Step 2: Update Analytics (Streaks)
        logger.info("📊 [Step 2/2] Updating Global Analytics & Streaks...");
        try {
            results.analyticsUpdate = await updateGlobalAnalytics();
            logger.info("✅ [Step 2/2] Global Analytics Update Complete");
        } catch (err) {
            logger.error({ error: err }, "❌ [Step 2/2] Global Analytics Update Failed");
            results.analyticsUpdate = { success: false, error: err };
        }

        logger.info("🏁 [Daily Tasks] Sequence finished");
        return { success: true, results };

    } catch (error) {
        logger.error({ error }, "❌ [Daily Tasks] Critical Orchestration Failure");
        return { success: false, error };
    }
}
