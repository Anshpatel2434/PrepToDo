// =============================================================================
// Admin Feature - Routes
// =============================================================================
import { Router } from 'express';
import { body, query } from 'express-validator';
import { validate } from '../../common/middleware/validate.js';
import { requireAdmin } from './middleware/admin.middleware.js';
import { adminLoginRateLimiter } from './middleware/admin-rate-limit.js';
import * as adminAuthController from './controllers/admin-auth.controller.js';
import * as adminDashboardController from './controllers/admin-dashboard.controller.js';
import * as adminUsersController from './controllers/admin-users.controller.js';
import * as adminFinancialsController from './controllers/admin-financials.controller.js';

const router = Router();

// =============================================================================
// Admin Auth Routes
// =============================================================================

// Login
router.post(
    '/auth/login',
    adminLoginRateLimiter,
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
        validate,
    ],
    adminAuthController.login
);

// Logout
router.post(
    '/auth/logout',
    requireAdmin,
    adminAuthController.logout
);

// Verify Session
router.get(
    '/auth/verify',
    requireAdmin,
    adminAuthController.verify
);

// =============================================================================
// Dashboard Routes
// =============================================================================
router.get('/dashboard/overview', requireAdmin, adminDashboardController.getOverview);
router.get('/dashboard/metrics-history', requireAdmin, adminDashboardController.getMetricsHistory);

// =============================================================================
// Users Routes
// =============================================================================
router.get(
    '/users',
    requireAdmin,
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        validate
    ],
    adminUsersController.getUsers
);

router.get('/users/:id', requireAdmin, adminUsersController.getUserDetails);

// =============================================================================
// Financials Routes
// =============================================================================
router.get(
    '/financials/cost-breakdown',
    requireAdmin,
    [
        query('timeframe').optional().isIn(['day', 'week', 'month']),
        validate
    ],
    adminFinancialsController.getCostBreakdown
);

// =============================================================================
// Content Routes
// =============================================================================
import * as adminContentController from './controllers/admin-content.controller.js';
import * as adminSystemController from './controllers/admin-system.controller.js';

router.get('/content/passages', requireAdmin, adminContentController.getPassages);
router.get('/content/questions', requireAdmin, adminContentController.getQuestions);
router.get('/content/exams', requireAdmin, adminContentController.getExams);

// =============================================================================
// System Routes
// =============================================================================
router.get('/system/logs', requireAdmin, adminSystemController.getActivityLogs);

export const adminRouter = router;
