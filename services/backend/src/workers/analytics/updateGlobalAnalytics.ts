import { db } from "../../db";
import { users } from "../../db/schema";
import { createChildLogger } from "../../common/utils/logger";
import { runAnalytics } from "./runAnalytics";

const logger = createChildLogger('global-analytics-worker');

/**
 * Updates analytics (and streaks) for ALL users.
 * This is designed to be run by the daily cron job.
 */
export async function updateGlobalAnalytics() {
    logger.info("🌍 [Global Analytics] Starting global analytics update...");

    try {
        // Fetch all users
        const allUsers = await db.select({ id: users.id }).from(users);
        logger.info(`👥 [Global Analytics] Found ${allUsers.length} users to process`);

        let processed = 0;
        let errors = 0;

        for (const user of allUsers) {
            try {
                // runAnalytics handles streak updates even if there are no new sessions
                await runAnalytics({ user_id: user.id });
                processed++;

                // Log progress every 50 users
                if (processed % 50 === 0) {
                    logger.info(`📊 [Global Analytics] Progress: ${processed}/${allUsers.length}`);
                }
            } catch (err) {
                errors++;
                logger.error({ userId: user.id, error: err }, "❌ Failed to update analytics for user");
            }
        }

        logger.info(`✅ [Global Analytics] Complete. Processed: ${processed}, Errors: ${errors}`);
        return { success: true, processed, errors };

    } catch (error) {
        logger.error({ error }, "❌ [Global Analytics] Fatal error fetching users");
        throw error;
    }
}
