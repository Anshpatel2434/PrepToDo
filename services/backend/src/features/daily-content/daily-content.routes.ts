// =============================================================================
// Daily Content Feature - Routes
// =============================================================================
import { Router } from 'express';

// Middleware
import { requireAuth } from '../auth/middleware/auth.middleware.js';

// Validation (using express-validator for now, can be replaced with Zod middleware)
import { body, query, param } from 'express-validator';
import { validate } from '../../common/middleware/validate.js';

// Controllers
import {
    fetchDailyTestData,
    fetchPreviousDailyTests,
    fetchDailyTestById,
    startDailyRCSession,
    startDailyVASession,
    fetchExistingSessionDetails,
    saveSessionDetails,
    saveQuestionAttempts,
    fetchLeaderboard,
    fetchArticlesByIds,
    generateDailyContent,
} from './controllers/daily-content.controller.js';

const router = Router();

// =============================================================================
// Public Routes (Read-only)
// =============================================================================

// Get today's daily test data
router.get('/today', fetchDailyTestData);

// Get previous daily tests (with pagination)
router.get(
    '/previous',
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        validate,
    ],
    fetchPreviousDailyTests
);

// Get specific daily test by ID
router.get(
    '/:exam_id',
    [
        param('exam_id').isUUID(),
        validate,
    ],
    fetchDailyTestById
);

// =============================================================================
// Protected Routes (Require Authentication)
// =============================================================================

// Start RC session
router.post(
    '/session/rc/start',
    requireAuth,
    [
        body('user_id').isUUID(),
        body('paper_id').isUUID(),
        body('passage_ids').optional().isArray(),
        body('question_ids').optional().isArray(),
        validate,
    ],
    startDailyRCSession
);

// Start VA session
router.post(
    '/session/va/start',
    requireAuth,
    [
        body('user_id').isUUID(),
        body('paper_id').isUUID(),
        body('passage_ids').optional().isArray(),
        body('question_ids').optional().isArray(),
        validate,
    ],
    startDailyVASession
);

// Fetch existing session details
router.get(
    '/session/existing',
    requireAuth,
    [
        query('user_id').isUUID(),
        query('paper_id').isUUID(),
        query('session_type').isIn(['daily_challenge_rc', 'daily_challenge_va']),
        validate,
    ],
    fetchExistingSessionDetails
);

// Save session details
router.put(
    '/session/save',
    requireAuth,
    [
        body('session_id').isUUID(),
        body('time_spent_seconds').isInt({ min: 0 }),
        body('completed_at').optional().isISO8601(),
        body('status').isIn(['in_progress', 'completed', 'abandoned', 'paused']),
        body('total_questions').isInt({ min: 0 }),
        body('correct_answers').isInt({ min: 0 }),
        body('score_percentage').isFloat({ min: 0, max: 100 }),
        body('current_question_index').isInt({ min: 0 }),
        validate,
    ],
    saveSessionDetails
);

// Save question attempts (batch)
router.post(
    '/attempts/save',
    requireAuth,
    [
        body('attempts').isArray(),
        body('attempts.*.user_id').isUUID(),
        body('attempts.*.session_id').isUUID(),
        body('attempts.*.question_id').isUUID(),
        body('attempts.*.passage_id').optional(),
        body('attempts.*.user_answer').exists(),
        body('attempts.*.is_correct').isBoolean(),
        body('attempts.*.time_spent_seconds').isInt({ min: 0 }),
        body('attempts.*.confidence_level').optional({ nullable: true }).isInt({ min: 1, max: 5 }),
        body('attempts.*.marked_for_review').isBoolean(),
        body('attempts.*.rationale_viewed').isBoolean(),
        body('attempts.*.rationale_helpful').optional({ nullable: true }),
        body('attempts.*.ai_feedback').optional({ nullable: true }),
        validate,
    ],
    saveQuestionAttempts
);

// Fetch leaderboard for a specific exam
router.get(
    '/leaderboard/:exam_id',
    [
        param('exam_id').isUUID(),
        validate,
    ],
    fetchLeaderboard
);

// Fetch articles by IDs
router.post(
    '/articles',
    [
        body('article_ids').isArray(),
        validate,
    ],
    fetchArticlesByIds
);

// =============================================================================
// Admin/Cron Routes
// =============================================================================

// Generate daily content (admin or cron job)
// TODO: Add admin middleware or API key authentication
router.post(
    '/generate',
    [
        body('force').optional().isBoolean(),
        validate,
    ],
    generateDailyContent
);

export const dailyContentRouter = router;