// =============================================================================
// Admin Feature - Auth Controller
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { config } from '../../../config/index.js';
import { Errors, successResponse } from '../../../common/utils/errors.js';
import { createChildLogger } from '../../../common/utils/logger.js';
import { generateAdminToken } from '../services/admin-jwt.service.js';

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

        // 2. Check Email Whitelist
        if (email !== config.admin.email) {
            // Log attempt with invalid email
            adminLogger.warn({ email, action: 'login_attempt' }, 'Admin login failed: Email not whitelisted');
            // Return generic creds error to avoid enumeration (though rate limit helps)
            throw Errors.invalidCredentials();
        }

        // 3. Verify Password
        const isMatch = await bcrypt.compare(password, config.admin.passwordHash);
        if (!isMatch) {
            adminLogger.warn({ email, action: 'login_attempt' }, 'Admin login failed: Invalid password');
            throw Errors.invalidCredentials();
        }

        // 4. Generate Token
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
        }, 'Admin login successful'));

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
