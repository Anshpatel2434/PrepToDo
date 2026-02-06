
import { Router } from 'express';
// Middleware
import { requireAuth } from '../auth/middleware/auth.middleware.js';

// Validation (using express-validator for now, can be replaced with Zod middleware)
import { body, query, param } from 'express-validator';
import { validate } from '../../common/middleware/validate';
import {
    fetchUserMetricProficiency,
    fetchAvailableGenres,
    fetchCustomizedMocks,
    createCustomizedMock,
    checkExistingSession,
    fetchMockTestById,
    startMockSession,
    fetchExistingMockSession,
    saveSessionDetails,
    saveQuestionAttempts,
    fetchGenerationStatus
} from './controllers/customized-mocks.controller';

const router = Router();

// =============================================================================
// Customized Mocks Routes
// =============================================================================

// Fetch proficiency
router.get(
    '/proficiency',
    requireAuth,
    [
        query('user_id').isUUID(),
        validate
    ],
    fetchUserMetricProficiency
);

// Fetch genres
router.get(
    '/genres',
    requireAuth,
    fetchAvailableGenres
);

// Fetch user's mocks
router.get(
    '/list',
    requireAuth,
    fetchCustomizedMocks
);

// Create new mock
router.post(
    '/create',
    requireAuth,
    [
        body('user_id').isUUID(),
        body('mock_name').optional().isString(),
        // Add more validation as needed
        validate
    ],
    createCustomizedMock
);

// Check session
router.get(
    '/session/check',
    requireAuth,
    [
        query('paper_id').isUUID(),
        validate
    ],
    checkExistingSession
);

// Fetch mock details
router.get(
    '/:exam_id/details',
    requireAuth,
    [
        param('exam_id').isUUID(),
        validate
    ],
    fetchMockTestById
);

// Start session
router.post(
    '/session/start',
    requireAuth,
    [
        body('user_id').isUUID(),
        body('paper_id').isUUID(),
        validate
    ],
    startMockSession
);

// Fetch existing session
router.get(
    '/session/existing',
    requireAuth,
    [
        query('user_id').isUUID(),
        query('paper_id').isUUID(),
        validate
    ],
    fetchExistingMockSession
);

// Save session
router.put(
    '/session/save',
    requireAuth,
    [
        body('session_id').isUUID(),
        validate
    ],
    saveSessionDetails
);

// Save attempts
router.post(
    '/attempts/save',
    requireAuth,
    [
        body('attempts').isArray(),
        validate
    ],
    saveQuestionAttempts
);

// Fetch generation status
router.get(
    '/:exam_id/status',
    requireAuth,
    [
        param('exam_id').isUUID(),
        validate
    ],
    fetchGenerationStatus
);

export const customizedMocksRouter = router;
