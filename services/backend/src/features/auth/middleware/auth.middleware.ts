// =============================================================================
// Auth Feature - JWT Middleware
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyAccessTokenWithSession, type JwtPayload } from '../services/jwt.service.js';
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
// Helper: Extract Token from Request
// Supports both Authorization header and cookies
// =============================================================================
function extractToken(req: Request): string | null {
    // First check Authorization header (for localStorage tokens)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Fall back to cookie
    return req.cookies?.preptodo_token || null;
}

// =============================================================================
// Require Authentication (Fast - JWT Only)
// =============================================================================
// This is the PRIMARY middleware for protected routes.
// Uses fast JWT-only verification (no database call).
// 
// Trust model: If the JWT is valid and not expired, the user is authenticated.
// Session invalidation is handled by short token expiry + refresh tokens.
// =============================================================================
export const requireAuth = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const token = extractToken(req);

        if (!token) {
            throw Errors.unauthorized();
        }

        // Fast verification - only checks JWT signature and expiry
        const payload = verifyAccessToken(token);

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
// Require Authentication WITH Session Check (Slow - Uses DB)
// =============================================================================
// Use this ONLY for critical operations where you need to guarantee
// the session hasn't been invalidated:
// - Logout
// - Password change
// - Account deletion
// - Session management
// =============================================================================
export const requireAuthWithSession = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = extractToken(req);

        if (!token) {
            throw Errors.unauthorized();
        }

        // Full verification with database session check
        const payload = await verifyAccessTokenWithSession(token);

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
export const optionalAuth = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const token = extractToken(req);

        if (token) {
            // Use fast verification for optional auth
            const payload = verifyAccessToken(token);
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

// Backwards compatibility aliases
export const requireAuthFast = requireAuth;
