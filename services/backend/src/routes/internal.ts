import express from "express";
import { runDailyTasks } from "../workers/runDailyTasks";
import { runPersonaHeartbeat } from "../workers/persona-forum/runPersonaHeartbeat.js";
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

// POST /internal/run-forum-heartbeat — Trigger AI tutor forum post generation
// Called by Google Apps Script cron every 12 hours
router.post("/run-forum-heartbeat", async (req, res) => {
    const secret = req.headers["x-cron-secret"];

    if (secret !== process.env.CRON_SECRET) {
        logger.warn({ ip: req.ip }, "🛑 Unauthorized access attempt to /run-forum-heartbeat");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        logger.info("💓 Received cron request to run forum heartbeat");
        const result = await runPersonaHeartbeat();

        if (result.success) {
            return res.json({ success: true, postId: result.postId });
        } else {
            return res.status(200).json({ success: false, reason: String(result.error) });
        }
    } catch (err) {
        logger.error({ error: err }, "❌ Forum heartbeat cron failed");
        return res.status(500).json({ error: "Forum heartbeat failed" });
    }
});

export default router;

