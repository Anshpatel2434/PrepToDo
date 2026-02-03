import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { ErrorCodes } from '../utils/errors.js';

// =============================================================================
// Rate Limit Response Generator
// =============================================================================
export const createRateLimitResponse = (retryAfterSeconds: number, message: string) => {
    return {
        success: false,
        error: {
            code: ErrorCodes.RATE_LIMITED,
            message,
            retryAfterSeconds,
        },
    };
};

// =============================================================================
// Rate Limiter Factory
// =============================================================================
export interface RateLimitConfig {
    windowMs: number;
    max: number;
    message: string;
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (req: Request) => string;
}

export const createRateLimiter = (config: RateLimitConfig) => {
    return rateLimit({
        windowMs: config.windowMs,
        max: config.max,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
        keyGenerator: config.keyGenerator ?? ((req: Request) => {
            return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                req.ip ||
                req.socket.remoteAddress ||
                'unknown';
        }),
        handler: (req: Request, res: Response) => {
            const retryAfter = Math.ceil((res.getHeader('Retry-After') as number) || config.windowMs / 1000);
            const minutes = Math.ceil(retryAfter / 60);
            const message = config.message.replace('{minutes}', minutes.toString());
            res.status(429).json(createRateLimitResponse(retryAfter, message));
        },
    });
};

// =============================================================================
// General API Rate Limiter (100 requests per 15 minutes)
// =============================================================================
export const generalRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests. Please try again in {minutes} minutes.',
});
