// =============================================================================
// Auth Feature - Routes
// =============================================================================
import { Router } from 'express';

// Middleware
import { requireAuth } from './middleware/auth.middleware.js';
import { verifyCaptcha, optionalCaptcha } from './middleware/captcha.middleware.js';
import { loginRateLimiter, otpRateLimiter, passwordResetRateLimiter } from './middleware/rateLimiters.js';

// Validation
import {
    validateCheckEmail,
    validateSendOtp,
    validateVerifyOtp,
    validateCompleteSignup,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateSetPassword,
    validateResendOtp,
    validateCheckPendingSignup,
} from './schemas/auth.schemas.js';

// Controllers
import {
    checkEmail,
    sendOtp,
    verifyOtpController,
    completeSignup,
    login,
    googleOAuthInit,
    googleOAuthCallback,
    logout,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    setPassword,
    resendOtp,
    checkPendingSignup,
    exchangeToken,
} from './controllers/auth.controller.js';

const router = Router();

// =============================================================================
// Public Routes
// =============================================================================

// Email check
router.post('/check-email', validateCheckEmail, optionalCaptcha, checkEmail);

// OTP flow
// router.post('/send-otp', otpRateLimiter, validateSendOtp, verifyCaptcha, sendOtp); // for production
router.post('/send-otp', otpRateLimiter, validateSendOtp, sendOtp); // for development
router.post('/verify-otp', validateVerifyOtp, verifyOtpController);
router.post('/resend-otp', otpRateLimiter, validateResendOtp, resendOtp);
router.post('/check-pending-signup', validateCheckPendingSignup, checkPendingSignup);

// Complete signup
router.post('/complete-signup', validateCompleteSignup, completeSignup);

// Login
router.post('/login', loginRateLimiter, validateLogin, optionalCaptcha, login);

// Google OAuth
router.get('/google', googleOAuthInit);
router.get('/google/callback', googleOAuthCallback);
router.post('/exchange-token', exchangeToken);

// Password reset
router.post('/forgot-password', passwordResetRateLimiter, validateForgotPassword, optionalCaptcha, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

// =============================================================================
// Protected Routes
// =============================================================================

// Auth required
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getCurrentUser);
router.post('/set-password', requireAuth, validateSetPassword, setPassword);

export const authRouter = router;
