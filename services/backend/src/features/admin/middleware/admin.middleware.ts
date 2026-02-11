// =============================================================================
// Admin Feature - Auth Middleware
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { verifyAdminToken, type AdminJwtPayload } from '../services/admin-jwt.service.js';
import { Errors } from '../../../common/utils/errors.js';
import { config } from '../../../config/index.js';
import { db } from '../../../db/index.js';
import { users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

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

        // 1. Verify token signature with admin secret
        const payload = verifyAdminToken(token);

        if (!payload) {
            throw Errors.adminUnauthorized();
        }

        // 2. Fetch user from DB to verify role and status
        // This prevents access if role is changed or user is banned in real-time
        const [user] = await db
            .select({
                id: users.id,
                email: users.email,
                role: users.role
            })
            .from(users)
            .where(eq(users.email, payload.email))
            .limit(1);

        if (!user) {
            throw Errors.adminUnauthorized();
        }

        // 3. Strict Role Check
        // Only 'admin' role allowed, with .env whitelist as a Super Admin override
        if (user.role !== 'admin' && user.email !== config.admin.email) {
            throw Errors.adminForbidden();
        }

        // Attach admin info to request
        req.admin = payload;

        next();
    } catch (error) {
        next(error);
    }
};
