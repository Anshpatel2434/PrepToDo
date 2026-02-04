import { Router } from "express";
import { triggerAnalytics } from "./analytics.controller";
import { requireAuth } from "../../features/auth";

const router = Router();

// Trigger analytics for the authenticated user
router.post("/trigger", requireAuth, triggerAnalytics);

export default router;