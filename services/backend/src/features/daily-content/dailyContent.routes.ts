import { Router } from 'express';
import { requireAuth } from '../../features/auth/middleware/auth.middleware.js';
import {
    getTodayDaily,
    getPreviousDailies,
    getDailyById,
    startSession,
    updateSession,
    saveAttempts,
    getLeaderboard,
    triggerDailyGeneration,
} from './controllers/dailyContent.controller.js';

const router = Router();

// =============================================================================
// Public Routes (no auth required)
// =============================================================================

// Get today's daily content
router.get('/today', getTodayDaily);

// Get previous daily tests
router.get('/previous', getPreviousDailies);

// Get specific daily test
router.get('/:examId', getDailyById);

// Get leaderboard for a daily exam
router.get('/:examId/leaderboard', getLeaderboard);

// =============================================================================
// Protected Routes (auth required)
// =============================================================================

// Start a new practice session
router.post('/start-session', requireAuth, startSession);

// Update session (progress, completion)
router.put('/session/:sessionId', requireAuth, updateSession);

// Save question attempts
router.post('/attempts', requireAuth, saveAttempts);

// =============================================================================
// Internal Routes (trigger generation)
// =============================================================================

// Trigger daily content generation (called by cron or internal service)
router.post('/internal/generate', triggerDailyGeneration);

export const dailyContentRouter = router;
