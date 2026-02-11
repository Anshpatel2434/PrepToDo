// =============================================================================
// Dashboard Feature - Routes
// =============================================================================
import { Router } from 'express';

// Middleware
import { requireAuth } from '../auth/middleware/auth.middleware.js';

// Controllers
import {
    getDashboardData,
    getUserProfile,
    getUserAnalytics,
    getUserProficiencySignals,
    getUserMetricProficiency,
    updateUserProfile,
    checkUsernameAvailability,
} from './controllers/dashboard.controller.js';

const router = Router();

// =============================================================================
// All routes require authentication
// =============================================================================

// Combined dashboard data (optimized single request)
router.get('/', requireAuth, getDashboardData);

// Individual endpoints
router.get('/profile', requireAuth, getUserProfile);
router.get('/analytics', requireAuth, getUserAnalytics);
router.get('/proficiency-signals', requireAuth, getUserProficiencySignals);
router.get('/metric-proficiency', requireAuth, getUserMetricProficiency);

// Check username availability
router.get('/profile/check-username', requireAuth, checkUsernameAvailability);

// Update profile
router.patch('/profile', requireAuth, updateUserProfile);

export default router;