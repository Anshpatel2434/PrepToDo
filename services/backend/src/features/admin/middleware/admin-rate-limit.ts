// =============================================================================
// Admin Feature - Rate Limiters
// =============================================================================
import { createRateLimiter } from '../../../common/middleware/rateLimiter.js';

// Stricter than user login (3 attempts per 30 mins)
export const adminLoginRateLimiter = createRateLimiter({
    windowMs: 30 * 60 * 1000,  // 30 minutes
    max: 3,                    // 3 attempts
    message: 'Too many admin login attempts. Please try again in {minutes} minutes.',
    skipSuccessfulRequests: true, // Don't count successful logins against the limit
});
