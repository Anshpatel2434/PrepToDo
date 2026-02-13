// =============================================================================
// AI Insights Feature - Routes
// =============================================================================
import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../common/middleware/validate.js';
import { requireAuth } from '../auth/middleware/auth.middleware.js';
import { generateInsight } from './ai-insights.controller.js';

const router = Router();

// Generate AI insight for a single question attempt
router.post(
    '/generate',
    requireAuth,
    [
        body('session_id').isUUID(),
        body('question_id').isUUID(),
        body('attempt_id').isUUID(),
        validate,
    ],
    generateInsight
);

export const aiInsightsRouter = router;
