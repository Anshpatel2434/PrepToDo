import express from "express";
import { runDailyTasks } from "../workers/runDailyTasks";
import { createChildLogger } from "../common/utils/logger";

const router = express.Router();
const logger = createChildLogger('internal-routes');

router.post("/run-daily-job", async (req, res) => {
    const secret = req.headers["x-cron-secret"];

    if (secret !== process.env.CRON_SECRET) {
        logger.warn({ ip: req.ip }, "🛑 Unauthorized access attempt to /run-daily-job");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // Check for optional skip generation flag (for testing or manual runs)
        const skipGeneration = req.query.skip_generation === 'true';

        logger.info({ skipGeneration }, "🕒 Received cron request to run daily tasks");

        // Run tasks in background (or await if desired - here we await to return status)
        const result = await runDailyTasks(skipGeneration);

        return res.json({ success: true, result });
    } catch (err) {
        logger.error({ error: err }, "❌ Cron job execution failed");
        return res.status(500).json({ error: "Cron failed" });
    }
});

export default router;
