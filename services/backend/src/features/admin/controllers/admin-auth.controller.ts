// =============================================================================
// Admin Feature - Auth Controller
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { config } from '../../../config/index.js';
import { Errors, successResponse } from '../../../common/utils/errors.js';
import { createChildLogger } from '../../../common/utils/logger.js';
import { generateAdminToken } from '../services/admin-jwt.service.js';
import { db } from '../../../db/index.js';
import { users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

const adminLogger = createChildLogger('admin-auth');

// =============================================================================
// Admin Login
// =============================================================================
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body;

        // 1. Validate Input
        if (!email || !password) {
            throw Errors.validationError({ message: 'Email and password are required.' });
        }

        // 2. Fetch User from DB
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()))
            .limit(1);

        if (!user) {
            adminLogger.warn({ email, action: 'login_attempt' }, 'Admin login failed: User not found');
            throw Errors.invalidCredentials();
        }

        // 3. Check Role Whitelist
        // Only 'admin' role allowed, or the Super Admin email from .env
        const isSuperAdmin = email === config.admin.email;
        const isAdminRole = user.role === 'admin';

        if (!isSuperAdmin && !isAdminRole) {
            adminLogger.warn({ email, action: 'login_attempt' }, 'Admin login failed: Unauthorized role');
            throw Errors.adminForbidden();
        }

        // 4. Verify Password
        // For Super Admin from .env, we might use config.admin.passwordHash
        // For regular DB admins, we use the DB's encrypted_password column
        let isMatch = false;
        if (isSuperAdmin && config.admin.passwordHash) {
            isMatch = await bcrypt.compare(password, config.admin.passwordHash);
        } else if (user.encrypted_password) {
            isMatch = await bcrypt.compare(password, user.encrypted_password);
        }

        // 4. Validate password match — CRITICAL: reject if password is wrong
        if (!isMatch) {
            adminLogger.warn({ email, action: 'login_attempt' }, 'Admin login failed: Invalid password');
            throw Errors.invalidCredentials();
        }

        // 5. Generate Token
        const token = generateAdminToken(email);

        // 5. Set Cookie
        res.cookie(config.admin.cookieName, token, {
            httpOnly: true,
            secure: config.isProduction, // Secure in prod
            sameSite: 'strict',          // Strict for admin
            maxAge: 60 * 60 * 1000,      // 1 hour
            path: '/',
        });

        // 6. Log Success
        adminLogger.info({ email, action: 'login_success' }, 'Admin logged in successfully');

        // 7. Return Success
        res.json(successResponse({
            authenticated: true,
            email,
            role: 'admin',
            token, // Return token for frontend storage
        }, 'Admin login successful'));

    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Auto-Login (from existing user session)
// Uses the normal user JWT to auto-establish an admin session.
// Called by the frontend when an admin user navigates to /admin.
// =============================================================================
export async function autoLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        // req.user is set by requireAuth middleware (normal user JWT)
        const userPayload = req.user;

        if (!userPayload?.userId || !userPayload?.email) {
            throw Errors.unauthorized();
        }

        // Verify user exists and has admin role
        const [user] = await db
            .select({ role: users.role, email: users.email })
            .from(users)
            .where(eq(users.id, userPayload.userId))
            .limit(1);

        if (!user) {
            throw Errors.unauthorized();
        }

        const isSuperAdmin = user.email === config.admin.email;
        const isAdminRole = user.role === 'admin';

        if (!isSuperAdmin && !isAdminRole) {
            adminLogger.warn({ email: user.email, action: 'auto_login_attempt' }, 'Auto-login denied: not an admin');
            throw Errors.adminForbidden();
        }

        // Generate admin token and set cookie
        const token = generateAdminToken(user.email);

        res.cookie(config.admin.cookieName, token, {
            httpOnly: true,
            secure: config.isProduction,
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000, // 1 hour
            path: '/',
        });

        adminLogger.info({ email: user.email, action: 'auto_login_success' }, 'Admin auto-logged in from user session');

        res.json(successResponse({
            authenticated: true,
            email: user.email,
            role: 'admin',
            token, // Return token for frontend storage
        }, 'Admin auto-login successful'));

    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Admin Logout
// =============================================================================
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.admin?.email;

        // 1. Clear Cookie
        res.clearCookie(config.admin.cookieName, {
            httpOnly: true,
            secure: config.isProduction,
            sameSite: 'strict',
            path: '/',
        });

        // 2. Log Logout
        adminLogger.info({ email, action: 'logout' }, 'Admin logged out');

        // 3. Return Success
        res.json(successResponse({ success: true }, 'Logged out successfully'));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Verify Admin Session
// =============================================================================
export async function verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        // Middleware has already verified the token if we get here
        const admin = req.admin;

        res.json(successResponse({
            authenticated: true,
            email: admin?.email,
            role: 'admin',
        }));
    } catch (error) {
        next(error);
    }
}
