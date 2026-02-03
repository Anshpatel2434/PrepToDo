// =============================================================================
// Auth Feature - JWT Middleware
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type JwtPayload } from '../services/jwt.service.js';
import { Errors } from '../../../common/utils/errors.js';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
            token?: string;
        }
    }
}

// =============================================================================
// Require Authentication
// =============================================================================
export const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from cookie
        const token = req.cookies?.preptodo_token;

        if (!token) {
            throw Errors.unauthorized();
        }

        // Verify token
        const payload = await verifyAccessToken(token);

        if (!payload) {
            throw Errors.sessionExpired();
        }

        // Attach user info to request
        req.user = payload;
        req.token = token;

        next();
    } catch (error) {
        next(error);
    }
};

// =============================================================================
// Optional Authentication (doesn't fail if no token)
// =============================================================================
export const optionalAuth = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.cookies?.auth_token;

        if (token) {
            const payload = await verifyAccessToken(token);
            if (payload) {
                req.user = payload;
                req.token = token;
            }
        }

        next();
    } catch {
        // Ignore errors, just continue without auth
        next();
    }
};
