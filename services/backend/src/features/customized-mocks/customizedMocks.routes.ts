import { Router } from 'express';
import { requireAuth } from '../../features/auth/middleware/auth.middleware.js';
import {
    listMocks,
    getUserProficiency,
    getGenres,
    generateMock,
    getMock,
    getMockStatus,
    startMockSession,
    getMockSession,
    updateMockSession,
    saveMockAttempts,
    deleteMock,
} from './controllers/customizedMocks.controller.js';

const router = Router();

// =============================================================================
// Public Routes (no auth required)
// =============================================================================

// Get available genres
router.get('/genres', getGenres);

// =============================================================================
// Protected Routes (auth required)
// =============================================================================

// List user's mocks with status
router.get('/', requireAuth, listMocks);

// Get user's proficiency for personalization
router.get('/proficiency', requireAuth, getUserProficiency);

// Start mock generation (async)
router.post('/generate', requireAuth, generateMock);

// Get mock test data
router.get('/:examId', requireAuth, getMock);

// Poll generation status
router.get('/:examId/status', requireAuth, getMockStatus);

// Start mock session
router.post('/:examId/start-session', requireAuth, startMockSession);

// Get existing session
router.get('/session/:sessionId', requireAuth, getMockSession);

// Update session
router.put('/session/:sessionId', requireAuth, updateMockSession);

// Save question attempts
router.post('/attempts', requireAuth, saveMockAttempts);

// Delete mock (if not started)
router.delete('/:examId', requireAuth, deleteMock);

export const customizedMocksRouter = router;
