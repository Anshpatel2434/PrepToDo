import type { Request, Response } from 'express';
import { eq, and, gt, lt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { db } from '../../../db/index.js';
import { authUsers, authSessions, authPendingSignups, authPasswordResetTokens, userProfiles } from '../../../db/schema.js';
import { config } from '../../../config/index.js';
import { Errors, successResponse } from '../../../common/utils/errors.js';
import { hashPassword, verifyPassword, generateSecureToken, hashToken, verifyTokenHash } from '../services/password.service.js';
import { generateAccessToken } from '../services/jwt.service.js';
import { generateOtp, hashOtp, verifyOtp, getOtpExpiryDate } from '../services/otp.service.js';
import { sendOtpEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { validateEmail } from '../services/emailValidator.service.js';
import { authLogger } from '../../../common/utils/logger.js';
import type { UserResponse, CheckEmailResponse, SendOtpResponse, VerifyOtpResponse, LoginResponse, CheckPendingSignupResponse, GoogleUserInfo } from '../types/auth.types.js';

// =============================================================================
// Helper Functions
// =============================================================================
async function ensureUserProfile(userId: string, email: string): Promise<void> {
    try {
        const [existingProfile] = await db
            .select()
            .from(userProfiles)
            .where(eq(userProfiles.id, userId))
            .limit(1);

        if (!existingProfile) {
            const username = generateUsername(email, userId);

            await db.insert(userProfiles).values({
                id: userId,
                email,
                username,
                displayName: email.split('@')[0],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
    } catch (err) {
        console.error('[Profile] Error ensuring profile:', err);
    }
}
function formatUserResponse(user: typeof authUsers.$inferSelect): UserResponse {
    return {
        id: user.id,
        email: user.email,
        emailConfirmedAt: user.emailConfirmedAt?.toISOString() || null,
        provider: user.provider || 'email',
        hasPassword: !!user.encryptedPassword,
        createdAt: user.createdAt?.toISOString() || null,
        updatedAt: user.updatedAt?.toISOString() || null,
    };
}

function setAuthCookie(res: Response, token: string): void {
    res.cookie(config.jwt.cookieName, token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    });
}

function clearAuthCookie(res: Response): void {
    res.clearCookie(config.jwt.cookieName, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction ? 'strict' : 'lax',
        path: '/',
    });
}

function getSessionExpiryDate(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
}

function generateUsername(email: string, userId: string): string {
    const emailPrefix = email.split('@')[0];
    const userIdPrefix = userId.slice(0, 3);
    const sanitizedEmailPrefix = emailPrefix.replace(/[^a-zA-Z0-9]/g, '');
    return `${sanitizedEmailPrefix}preptodo${userIdPrefix}`;
}

async function createSession(userId: string, email: string, req: Request, res: Response): Promise<void> {
    const sessionId = uuidv4();
    const refreshToken = generateSecureToken();
    const expiresAt = getSessionExpiryDate();

    // Ensure user profile exists
    await ensureUserProfile(userId, email);

    // Store session in database
    await db.insert(authSessions).values({
        id: sessionId,
        userId,
        refreshTokenHash: await hashToken(refreshToken),
        userAgent: req.headers['user-agent'] || null,
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null,
        expiresAt,
    });

    // Generate JWT and set cookie
    const token = generateAccessToken(userId, email, sessionId);
    setAuthCookie(res, token);
}

// =============================================================================
// Check Email Controller
// =============================================================================
export async function checkEmail(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    // Validate email format and domain
    const validation = await validateEmail(email);
    if (!validation.valid) {
        throw Errors.invalidEmail(validation.reason);
    }

    // Check if user exists
    const [existingUser] = await db
        .select()
        .from(authUsers)
        .where(eq(authUsers.email, email.toLowerCase()))
        .limit(1);

    const response: CheckEmailResponse = {
        exists: !!existingUser,
        hasPassword: existingUser?.encryptedPassword ? true : false,
    };

    res.json(successResponse(response));
}

// =============================================================================
// Send OTP Controller
// =============================================================================
export async function sendOtp(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    // Validate email
    const validation = await validateEmail(email);
    if (!validation.valid) {
        throw Errors.invalidEmail(validation.reason);
    }

    // Check if email already exists
    const [existingUser] = await db
        .select()
        .from(authUsers)
        .where(eq(authUsers.email, email.toLowerCase()))
        .limit(1);

    if (existingUser) {
        throw Errors.emailAlreadyExists();
    }

    // Check for existing pending signup (to prevent spam)
    const [existingPending] = await db
        .select()
        .from(authPendingSignups)
        .where(
            and(
                eq(authPendingSignups.email, email.toLowerCase()),
                gt(authPendingSignups.expiresAt, new Date())
            )
        )
        .limit(1);

    // If recent OTP exists and was sent less than 60 seconds ago, reject
    if (existingPending) {
        const createdAt = existingPending.createdAt!;
        const secondsSinceCreated = (Date.now() - createdAt.getTime()) / 1000;
        if (secondsSinceCreated < 60) {
            throw Errors.otpAlreadySent();
        }
        // Delete old pending signup
        await db.delete(authPendingSignups).where(eq(authPendingSignups.id, existingPending.id));
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = getOtpExpiryDate();
    const pendingSignupId = uuidv4();

    // Store pending signup
    await db.insert(authPendingSignups).values({
        id: pendingSignupId,
        email: email.toLowerCase(),
        otpHash,
        expiresAt,
    });

    // Send OTP email
    await sendOtpEmail(email.toLowerCase(), otp);

    const response: SendOtpResponse = {
        pendingSignupId,
        expiresAt: expiresAt.toISOString(),
        message: 'Verification code sent to your email.',
    };

    res.json(successResponse(response));
}

// =============================================================================
// Verify OTP Controller
// =============================================================================
export async function verifyOtpController(req: Request, res: Response): Promise<void> {
    const { email, otp, pendingSignupId } = req.body;

    // Find pending signup
    const whereConditions = [eq(authPendingSignups.email, email.toLowerCase())];
    if (pendingSignupId) {
        whereConditions.push(eq(authPendingSignups.id, pendingSignupId));
    }

    const [pendingSignup] = await db
        .select()
        .from(authPendingSignups)
        .where(and(...whereConditions))
        .limit(1);

    if (!pendingSignup) {
        throw Errors.pendingSignupNotFound();
    }

    // Check expiration
    if (pendingSignup.expiresAt < new Date()) {
        // Clean up expired signup
        await db.delete(authPendingSignups).where(eq(authPendingSignups.id, pendingSignup.id));
        throw Errors.otpExpired();
    }

    // Verify OTP
    if (!verifyOtp(otp, pendingSignup.otpHash)) {
        // Increment attempts
        const attempts = parseInt(pendingSignup.attempts || '0', 10) + 1;

        if (attempts >= 5) {
            // Too many failed attempts, delete pending signup
            await db.delete(authPendingSignups).where(eq(authPendingSignups.id, pendingSignup.id));
            throw Errors.pendingSignupExpired();
        }

        await db
            .update(authPendingSignups)
            .set({ attempts: attempts.toString() })
            .where(eq(authPendingSignups.id, pendingSignup.id));

        throw Errors.invalidOtp();
    }

    const response: VerifyOtpResponse = {
        verified: true,
        pendingSignupId: pendingSignup.id,
        email: pendingSignup.email,
    };

    res.json(successResponse(response, 'Email verified successfully.'));
}

// =============================================================================
// Complete Signup Controller
// =============================================================================
export async function completeSignup(req: Request, res: Response): Promise<void> {
    const { email, pendingSignupId, password, skipPassword } = req.body;

    // Verify pending signup exists
    const [pendingSignup] = await db
        .select()
        .from(authPendingSignups)
        .where(
            and(
                eq(authPendingSignups.id, pendingSignupId),
                eq(authPendingSignups.email, email.toLowerCase())
            )
        )
        .limit(1);

    if (!pendingSignup) {
        throw Errors.pendingSignupNotFound();
    }

    if (pendingSignup.expiresAt < new Date()) {
        await db.delete(authPendingSignups).where(eq(authPendingSignups.id, pendingSignup.id));
        throw Errors.pendingSignupExpired();
    }

    // Create user
    const userId = uuidv4();
    const encryptedPassword = password ? await hashPassword(password) : null;

    await db.insert(authUsers).values({
        id: userId,
        email: email.toLowerCase(),
        encryptedPassword,
        emailConfirmedAt: new Date(),
        provider: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // Delete pending signup
    await db.delete(authPendingSignups).where(eq(authPendingSignups.id, pendingSignup.id));

    // Create session
    await createSession(userId, email.toLowerCase(), req, res);

    // Get created user
    const [user] = await db
        .select()
        .from(authUsers)
        .where(eq(authUsers.id, userId))
        .limit(1);

    res.status(201).json(successResponse(
        { user: formatUserResponse(user!) },
        skipPassword ? 'Account created! You can set a password later.' : 'Account created successfully!'
    ));
}

// =============================================================================
// Login Controller
// =============================================================================
export async function login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    // Find user
    const [user] = await db
        .select()
        .from(authUsers)
        .where(eq(authUsers.email, email.toLowerCase()))
        .limit(1);

    if (!user) {
        authLogger.warn({ email, action: 'login' }, 'Login failed: user not found');
        throw Errors.invalidCredentials();
    }

    // Check if user has password
    if (!user.encryptedPassword) {
        throw Errors.passwordNotSet();
    }

    // Verify password
    const isValid = await verifyPassword(password, user.encryptedPassword);
    if (!isValid) {
        authLogger.warn({ email, userId: user.id, action: 'login' }, 'Login failed: invalid password');
        throw Errors.invalidCredentials();
    }

    // Update last sign in
    await db
        .update(authUsers)
        .set({ lastSignInAt: new Date(), updatedAt: new Date() })
        .where(eq(authUsers.id, user.id));

    // Create session
    await createSession(user.id, user.email!, req, res);

    const response: LoginResponse = {
        user: formatUserResponse(user),
        message: 'Logged in successfully!',
    };

    authLogger.info({ email, userId: user.id, action: 'login' }, 'User logged in successfully');
    res.json(successResponse(response));
}

// =============================================================================
// Google OAuth Initiate
// =============================================================================
export async function googleOAuthInit(req: Request, res: Response): Promise<void> {
    const returnTo = req.query.returnTo as string || '/';
    const csrfToken = generateSecureToken(16);

    console.log('[Google OAuth] Init - CSRF token generated:', csrfToken.substring(0, 8) + '...');

    // Store CSRF token in cookie for verification
    // Note: Using path '/' so it's sent back on callback
    res.cookie('oauth_csrf', csrfToken, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000, // 10 minutes
        path: '/',
    });

    const params = new URLSearchParams({
        client_id: config.google.clientId,
        redirect_uri: config.google.callbackUrl,
        response_type: 'code',
        scope: 'email profile',
        access_type: 'offline',
        prompt: 'consent',
        state: JSON.stringify({ returnTo, csrfToken }),
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

// =============================================================================
// Google OAuth Callback
// =============================================================================
export async function googleOAuthCallback(req: Request, res: Response): Promise<void> {
    const { code, state, error } = req.query;

    console.log('[Google OAuth] Callback received');
    console.log('[Google OAuth] Cookies:', req.cookies);
    console.log('[Google OAuth] State:', state);

    if (error) {
        console.error('[Google OAuth] Error:', error);
        res.redirect(`${config.frontendUrl}/auth?error=oauth_cancelled`);
        return;
    }

    if (!code || !state) {
        res.redirect(`${config.frontendUrl}/auth?error=oauth_failed`);
        return;
    }

    try {
        // Parse and verify state
        const stateData = JSON.parse(state as string);
        const storedCsrf = req.cookies?.oauth_csrf;

        console.log('[Google OAuth] CSRF from state:', stateData.csrfToken?.substring(0, 8) + '...');
        console.log('[Google OAuth] CSRF from cookie:', storedCsrf?.substring(0, 8) + '...');

        if (!storedCsrf || stateData.csrfToken !== storedCsrf) {
            console.error('[Google OAuth] CSRF mismatch!');
            res.redirect(`${config.frontendUrl}/auth?error=csrf_mismatch`);
            return;
        }

        // Clear CSRF cookie
        res.clearCookie('oauth_csrf', { path: '/' });

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code as string,
                client_id: config.google.clientId,
                client_secret: config.google.clientSecret,
                redirect_uri: config.google.callbackUrl,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json() as { access_token?: string };

        if (!tokens.access_token) {
            throw new Error('No access token received');
        }

        // Get user info
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const userInfo = await userInfoResponse.json() as GoogleUserInfo;

        if (!userInfo.email || !userInfo.verified_email) {
            res.redirect(`${config.frontendUrl}/auth?error=email_not_verified`);
            return;
        }

        // Check if user exists
        let [user] = await db
            .select()
            .from(authUsers)
            .where(eq(authUsers.email, userInfo.email.toLowerCase()))
            .limit(1);

        if (user) {
            // Update existing user with Google info if not already linked
            if (!user.googleId) {
                await db
                    .update(authUsers)
                    .set({
                        googleId: userInfo.id,
                        isSsoUser: true,
                        updatedAt: new Date(),
                    })
                    .where(eq(authUsers.id, user.id));
            }

            // Update last sign in
            await db
                .update(authUsers)
                .set({ lastSignInAt: new Date(), updatedAt: new Date() })
                .where(eq(authUsers.id, user.id));
        } else {
            // Create new user
            const userId = uuidv4();
            await db.insert(authUsers).values({
                id: userId,
                email: userInfo.email.toLowerCase(),
                emailConfirmedAt: new Date(),
                provider: 'google',
                googleId: userInfo.id,
                isSsoUser: true,
                rawUserMetaData: JSON.stringify({
                    name: userInfo.name,
                    given_name: userInfo.given_name,
                    family_name: userInfo.family_name,
                    picture: userInfo.picture,
                }),
                createdAt: new Date(),
                updatedAt: new Date(),
            });


            [user] = await db
                .select()
                .from(authUsers)
                .where(eq(authUsers.id, userId))
                .limit(1);
        }

        // Instead of setting cookie here (which won't work cross-origin),
        // redirect to frontend with the token as a query param
        // The frontend will then call /exchange-token to set the cookie via proxy

        // Ensure user profile exists
        await ensureUserProfile(user!.id, user!.email!);

        // Generate the session data
        const sessionId = uuidv4();
        const refreshToken = generateSecureToken();
        const expiresAt = getSessionExpiryDate();

        // Store session in database
        await db.insert(authSessions).values({
            id: sessionId,
            userId: user!.id,
            refreshTokenHash: await hashToken(refreshToken),
            userAgent: req.headers['user-agent'] || null,
            ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null,
            expiresAt,
        });

        // Generate JWT token
        const token = generateAccessToken(user!.id, user!.email!, sessionId);

        // Redirect to frontend with token in URL (will be exchanged for cookie)
        const returnTo = stateData.returnTo || '/dashboard';
        authLogger.info({ email: user!.email, userId: user!.id, provider: 'google', action: 'oauth_login' }, 'Google OAuth login successful');
        res.redirect(`${config.frontendUrl}/auth/callback?token=${encodeURIComponent(token)}&returnTo=${encodeURIComponent(returnTo)}`);
    } catch (err) {
        authLogger.error({ error: (err as Error).message, action: 'oauth_login' }, 'Google OAuth login failed');
        res.redirect(`${config.frontendUrl}/auth?error=oauth_failed`);
    }
}

// =============================================================================
// Exchange Token for Cookie (called from frontend via proxy)
// =============================================================================
export async function exchangeToken(req: Request, res: Response): Promise<void> {
    const { token } = req.body;

    if (!token) {
        throw Errors.badRequest('Token is required');
    }

    // Simply set the cookie - the token is already valid JWT from OAuth callback
    setAuthCookie(res, token);

    res.json(successResponse({ message: 'Session activated' }));
}

// =============================================================================
// Logout Controller
// =============================================================================
export async function logout(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    const sessionId = req.user?.sessionId;

    if (sessionId) {
        // Delete session from database
        await db
            .delete(authSessions)
            .where(eq(authSessions.id, sessionId));
    }

    clearAuthCookie(res);

    authLogger.info({ userId, sessionId, action: 'logout' }, 'User logged out');
    res.json(successResponse({ message: 'Logged out successfully.' }));
}

// =============================================================================
// Get Current User Controller
// =============================================================================
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        throw Errors.unauthorized();
    }

    const [user] = await db
        .select()
        .from(authUsers)
        .where(eq(authUsers.id, req.user.userId))
        .limit(1);

    if (!user) {
        throw Errors.unauthorized();
    }

    res.json(successResponse({ user: formatUserResponse(user) }));
}

// =============================================================================
// Forgot Password Controller
// =============================================================================
export async function forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    // Find user
    const [user] = await db
        .select()
        .from(authUsers)
        .where(eq(authUsers.email, email.toLowerCase()))
        .limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
        res.json(successResponse({ message: 'If an account exists with this email, you will receive a password reset link.' }));
        return;
    }

    // Delete any existing reset tokens
    await db
        .delete(authPasswordResetTokens)
        .where(eq(authPasswordResetTokens.userId, user.id));

    // Generate reset token
    const resetToken = generateSecureToken();
    const tokenHash = await hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    await db.insert(authPasswordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt,
    });

    // Send email
    await sendPasswordResetEmail(user.email!, resetToken);

    authLogger.info({ email, userId: user.id, action: 'forgot_password' }, 'Password reset email sent');
    res.json(successResponse({ message: 'If an account exists with this email, you will receive a password reset link.' }));
}

// =============================================================================
// Reset Password Controller
// =============================================================================
export async function resetPassword(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body;

    // Find all non-expired tokens
    const allTokens = await db
        .select()
        .from(authPasswordResetTokens)
        .where(gt(authPasswordResetTokens.expiresAt, new Date()));

    // Find the matching token
    let matchedToken = null;
    for (const t of allTokens) {
        if (verifyTokenHash(token, t.tokenHash)) {
            matchedToken = t;
            break;
        }
    }

    if (!matchedToken) {
        authLogger.warn({ action: 'reset_password' }, 'Reset password failed: invalid or expired token');
        throw Errors.resetTokenInvalid();
    }

    if (matchedToken.usedAt) {
        throw Errors.resetTokenExpired();
    }

    // Update password
    const encryptedPassword = await hashPassword(password);
    await db
        .update(authUsers)
        .set({ encryptedPassword, updatedAt: new Date() })
        .where(eq(authUsers.id, matchedToken.userId));

    // Mark token as used
    await db
        .update(authPasswordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(authPasswordResetTokens.id, matchedToken.id));

    // Invalidate all sessions
    await db
        .delete(authSessions)
        .where(eq(authSessions.userId, matchedToken.userId));

    authLogger.info({ userId: matchedToken.userId, action: 'reset_password' }, 'Password reset successfully, all sessions invalidated');
    res.json(successResponse({ message: 'Password reset successfully. Please log in with your new password.' }));
}

// =============================================================================
// Set Password Controller (for Google users)
// =============================================================================
export async function setPassword(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        throw Errors.unauthorized();
    }

    const { password } = req.body;

    const encryptedPassword = await hashPassword(password);
    await db
        .update(authUsers)
        .set({ encryptedPassword, updatedAt: new Date() })
        .where(eq(authUsers.id, req.user.userId));

    res.json(successResponse({ message: 'Password set successfully. You can now login with email and password.' }));
}

// =============================================================================
// Resend OTP Controller
// =============================================================================
export async function resendOtp(req: Request, res: Response): Promise<void> {
    const { email, pendingSignupId } = req.body;

    // Find existing pending signup
    const [pendingSignup] = await db
        .select()
        .from(authPendingSignups)
        .where(eq(authPendingSignups.id, pendingSignupId))
        .limit(1);

    if (!pendingSignup || pendingSignup.email !== email.toLowerCase()) {
        throw Errors.pendingSignupNotFound();
    }

    // Check cooldown (60 seconds)
    const createdAt = pendingSignup.createdAt!;
    const secondsSinceCreated = (Date.now() - createdAt.getTime()) / 1000;
    if (secondsSinceCreated < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceCreated);
        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMITED',
                message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
                retryAfterSeconds: waitSeconds,
            },
        });
        return;
    }

    // Generate new OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = getOtpExpiryDate();

    // Update pending signup
    await db
        .update(authPendingSignups)
        .set({
            otpHash,
            expiresAt,
            createdAt: new Date(),
            attempts: '0',
        })
        .where(eq(authPendingSignups.id, pendingSignup.id));

    // Send new OTP
    await sendOtpEmail(email.toLowerCase(), otp);

    res.json(successResponse({
        pendingSignupId: pendingSignup.id,
        expiresAt: expiresAt.toISOString(),
        message: 'New verification code sent.',
    }));
}

// =============================================================================
// Check Pending Signup Controller
// =============================================================================
export async function checkPendingSignup(req: Request, res: Response): Promise<void> {
    const { pendingSignupId } = req.body;

    const [pendingSignup] = await db
        .select()
        .from(authPendingSignups)
        .where(
            and(
                eq(authPendingSignups.id, pendingSignupId),
                gt(authPendingSignups.expiresAt, new Date())
            )
        )
        .limit(1);

    if (!pendingSignup) {
        res.json(successResponse({ valid: false } as CheckPendingSignupResponse));
        return;
    }

    const response: CheckPendingSignupResponse = {
        valid: true,
        email: pendingSignup.email,
        expiresAt: pendingSignup.expiresAt.toISOString(),
    };

    res.json(successResponse(response));
}

// =============================================================================
// Cleanup Expired Data (can be called by cron)
// =============================================================================
export async function cleanupExpired(): Promise<void> {
    const now = new Date();

    // Delete expired pending signups
    await db
        .delete(authPendingSignups)
        .where(lt(authPendingSignups.expiresAt, now));

    // Delete expired password reset tokens
    await db
        .delete(authPasswordResetTokens)
        .where(lt(authPasswordResetTokens.expiresAt, now));

    // Delete expired sessions
    await db
        .delete(authSessions)
        .where(lt(authSessions.expiresAt, now));

    console.log('[Cleanup] Expired data cleaned up');
}
