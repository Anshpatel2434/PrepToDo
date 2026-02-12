// =============================================================================
// Auth Feature - CAPTCHA Middleware
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { config } from '../../../config/index.js';
import { Errors } from '../../../common/utils/errors.js';
import { authLogger } from '../../../common/utils/logger.js';

// Turnstile verification response type
interface TurnstileResponse {
    success: boolean;
    'error-codes'?: string[];
    challenge_ts?: string;
    hostname?: string;
}

// =============================================================================
// Verify Cloudflare Turnstile CAPTCHA
// =============================================================================
export const verifyCaptcha = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Skip CAPTCHA in development if not configured
        if (!config.turnstile.secretKey) {
            authLogger.warn('[CAPTCHA] Secret key not configured, skipping verification');
            return next();
        }

        const token = req.body?.captchaToken;

        if (!token) {
            throw Errors.captchaRequired();
        }

        // Verify with Cloudflare
        const response = await fetch(config.turnstile.verifyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: config.turnstile.secretKey,
                response: token,
                remoteip: req.ip || '',
            }),
        });

        const data = await response.json() as TurnstileResponse;

        if (!data.success) {
            authLogger.error({
                errorCodes: data['error-codes'],
                secretKeyPrefix: config.turnstile.secretKey ? `${config.turnstile.secretKey.substring(0, 4)}...` : 'undefined'
            }, '[CAPTCHA] Verification failed');
            throw Errors.captchaFailed();
        }

        next();
    } catch (error) {
        next(error);
    }
};

// =============================================================================
// Optional CAPTCHA (use after N failed attempts)
// =============================================================================
export const optionalCaptcha = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    // If captcha token is provided, verify it
    if (req.body?.captchaToken) {
        return verifyCaptcha(req, res, next);
    }

    // Otherwise, continue without verification
    next();
};
