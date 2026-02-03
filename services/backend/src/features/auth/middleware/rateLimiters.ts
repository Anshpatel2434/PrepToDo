// =============================================================================
// Auth Feature - Rate Limiters
// =============================================================================
import { createRateLimiter } from '../../../common/middleware/rateLimiter.js';

// Login: 5 attempts per 15 minutes
export const loginRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts. Please try again in {minutes} minutes.',
    skipSuccessfulRequests: true,
});

// OTP Send: 3 attempts per 2 minutes
export const otpRateLimiter = createRateLimiter({
    windowMs: 2 * 60 * 1000,
    max: 3,
    message: 'Too many OTP requests. Please try again in {minutes} minutes.',
});

// Password Reset: 3 attempts per hour
export const passwordResetRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Too many password reset requests. Please try again in {minutes} minutes.',
});
