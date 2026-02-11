// =============================================================================
// Admin Feature - Auth Middleware
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { verifyAdminToken, type AdminJwtPayload } from '../services/admin-jwt.service.js';
import { Errors } from '../../../common/utils/errors.js';
import { config } from '../../../config/index.js';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            admin?: AdminJwtPayload;
        }
    }
}

// =============================================================================
// Helper: Extract Admin Token from Request
// Supports both Authorization header and admin cookie
// =============================================================================
function extractAdminToken(req: Request): string | null {
    // First check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Fall back to admin cookie
    return req.cookies?.[config.admin.cookieName] || null;
}

// =============================================================================
// Require Admin Authentication
// =============================================================================
export const requireAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = extractAdminToken(req);

        if (!token) {
            throw Errors.adminUnauthorized();
        }

        // Verify token signature with admin secret
        const payload = verifyAdminToken(token);

        if (!payload) {
            throw Errors.adminUnauthorized();
        }

        // Strict email check - double security
        if (payload.email !== config.admin.email) {
            throw Errors.adminForbidden();
        }

        // Attach admin info to request
        req.admin = payload;

        next();
    } catch (error) {
        next(error);
    }
};
