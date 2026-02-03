import { Router } from 'express';
import { requireAuth } from '../../features/auth/middleware/auth.middleware.js';
import {
    processAnalytics,
    internalAnalyticsTrigger,
    getUserDashboard,
} from './controllers/analytics.controller.js';

const router = Router();

// =============================================================================
// Protected Routes (auth required)
// =============================================================================

// Process unanalyzed sessions
router.post('/process', requireAuth, processAnalytics);

// Get user dashboard
router.get('/dashboard', requireAuth, getUserDashboard);

// =============================================================================
// Internal Routes (called by DB triggers or cron)
// =============================================================================

// Internal trigger for batch analytics processing
router.post('/internal/trigger', internalAnalyticsTrigger);

export const analyticsRouter = router;
