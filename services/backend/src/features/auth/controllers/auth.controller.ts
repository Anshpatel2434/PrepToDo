import type { Request, Response, NextFunction } from 'express';
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
import { validateReturnTo } from '../services/urlValidator.js';
import { authLogger } from '../../../common/utils/logger.js';
import { AdminActivityService } from '../../admin/services/admin-activity.service.js';
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
                display_name: email.split('@')[0],
                created_at: new Date(),
                updated_at: new Date(),
            });
        }
    } catch (err) {
        authLogger.error({ error: err instanceof Error ? err.message : String(err), userId, email }, 'Error ensuring profile');
    }
}
function formatUserResponse(user: typeof authUsers.$inferSelect): UserResponse {
    return {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at?.toISOString() || null,
        provider: user.provider || 'email',
        has_password: !!user.encrypted_password,
        role: (user as any).role || 'user',
        created_at: user.created_at?.toISOString() || null,
        updated_at: user.updated_at?.toISOString() || null,
    };
}


function setAuthCookie(res: Response, token: string): void {
    res.cookie(config.jwt.cookieName, token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches jwt.expiresIn)
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

async function createSession(userId: string, email: string, req: Request, res: Response): Promise<string> {
    const sessionId = uuidv4();
    const expiresAt = getSessionExpiryDate();

    // Ensure user profile exists
    await ensureUserProfile(userId, email);

    // Store session in database
    await db.insert(authSessions).values({
        id: sessionId,
        user_id: userId,
        refresh_token_hash: '',
        user_agent: req.headers['user-agent'] || null,
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null,
        expires_at: expiresAt,
    });

    // Generate JWT (long-lived, matches session duration)
    const accessToken = generateAccessToken(userId, email, sessionId);

    // Set cookie
    setAuthCookie(res, accessToken);

    return accessToken;
}

// =============================================================================
// Check Email Controller
// =============================================================================
export async function checkEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
            hasPassword: existingUser?.encrypted_password ? true : false,
        };

        res.json(successResponse(response));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Send OTP Controller
// =============================================================================
export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase();

        // Validate email
        const validation = await validateEmail(email);
        if (!validation.valid) {
            throw Errors.invalidEmail(validation.reason);
        }

        // Check if email already exists as a registered user
        const [existingUser] = await db
            .select()
            .from(authUsers)
            .where(eq(authUsers.email, normalizedEmail))
            .limit(1);

        if (existingUser) {
            throw Errors.emailAlreadyExists();
        }

        // Check for existing pending signup
        const [existingPending] = await db
            .select()
            .from(authPendingSignups)
            .where(eq(authPendingSignups.email, normalizedEmail))
            .limit(1);

        // Check if user is banned from sending OTPs
        if (existingPending?.banned_until && existingPending.banned_until > new Date()) {
            const minutesLeft = Math.ceil((existingPending.banned_until.getTime() - Date.now()) / 60000);
            res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMITED',
                    message: `Too many attempts. Please try again in ${minutesLeft} minutes.`,
                    bannedUntil: existingPending.banned_until.toISOString(),
                },
            });
            return;
        }

        // If existing pending signup, check rate limiting
        if (existingPending) {
            const createdAt = existingPending.created_at!;
            const secondsSinceCreated = (Date.now() - createdAt.getTime()) / 1000;
            const sendCount = existingPending.otp_send_count || 1;

            // Check cooldown (30 seconds between OTPs)
            if (secondsSinceCreated < 30) {
                const waitSeconds = Math.ceil(30 - secondsSinceCreated);
                res.status(429).json({
                    success: false,
                    error: {
                        code: 'OTP_ALREADY_SENT',
                        message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
                        retryAfterSeconds: waitSeconds,
                    },
                });
                return;
            }

            // Check if max attempts reached (3 attempts = ban for 15 minutes)
            if (sendCount >= 3) {
                const bannedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
                await db
                    .update(authPendingSignups)
                    .set({ banned_until: bannedUntil })
                    .where(eq(authPendingSignups.id, existingPending.id));

                res.status(429).json({
                    success: false,
                    error: {
                        code: 'RATE_LIMITED',
                        message: 'Too many attempts. Please try again in 15 minutes.',
                        bannedUntil: bannedUntil.toISOString(),
                    },
                });
                return;
            }

            // Update existing pending signup with new OTP
            const otp = generateOtp();
            const otpHash = hashOtp(otp);
            const expiresAt = getOtpExpiryDate();

            await db
                .update(authPendingSignups)
                .set({
                    otp_hash: otpHash,
                    expires_at: expiresAt,
                    created_at: new Date(),
                    attempts: '0',
                    otp_send_count: sendCount + 1,
                })
                .where(eq(authPendingSignups.id, existingPending.id));

            // Send OTP email
            await sendOtpEmail(normalizedEmail, otp);

            const response: SendOtpResponse = {
                pending_signup_id: existingPending.id,
                expires_at: expiresAt.toISOString(),
                message: 'Verification code sent to your email.',
            };

            res.json(successResponse(response));
            return;
        }

        // No existing pending signup - create new one
        const otp = generateOtp();
        const otpHash = hashOtp(otp);
        const expiresAt = getOtpExpiryDate();
        const pendingSignupId = uuidv4();

        await db.insert(authPendingSignups).values({
            id: pendingSignupId,
            email: normalizedEmail,
            otp_hash: otpHash,
            expires_at: expiresAt,
            otp_send_count: 1,
        });

        // Send OTP email
        await sendOtpEmail(normalizedEmail, otp);

        const response: SendOtpResponse = {
            pending_signup_id: pendingSignupId,
            expires_at: expiresAt.toISOString(),
            message: 'Verification code sent to your email.',
        };

        res.json(successResponse(response));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Verify OTP Controller
// =============================================================================
export async function verifyOtpController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
        if (pendingSignup.expires_at < new Date()) {
            // Clean up expired signup
            await db.delete(authPendingSignups).where(eq(authPendingSignups.id, pendingSignup.id));
            throw Errors.otpExpired();
        }

        // Verify OTP
        if (!verifyOtp(otp, pendingSignup.otp_hash)) {
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
            pending_signup_id: pendingSignup.id,
            email: pendingSignup.email,
        };

        res.json(successResponse(response, 'Email verified successfully.'));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Complete Signup Controller
// =============================================================================
export async function completeSignup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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

        if (pendingSignup.expires_at < new Date()) {
            await db.delete(authPendingSignups).where(eq(authPendingSignups.id, pendingSignup.id));
            throw Errors.pendingSignupExpired();
        }

        // Create user
        const userId = uuidv4();
        const encryptedPassword = password ? await hashPassword(password) : null;

        await db.insert(authUsers).values({
            id: userId,
            email: email.toLowerCase(),
            encrypted_password: encryptedPassword,
            email_confirmed_at: new Date(),
            provider: 'email',
            created_at: new Date(),
            updated_at: new Date(),
        });

        // Delete pending signup
        await db.delete(authPendingSignups).where(eq(authPendingSignups.id, pendingSignup.id));

        // Create session and get token
        const accessToken = await createSession(userId, email.toLowerCase(), req, res);

        // Log activity
        await AdminActivityService.logLogin(userId);

        // Get created user
        const [user] = await db
            .select()
            .from(authUsers)
            .where(eq(authUsers.id, userId))
            .limit(1);

        res.status(201).json(successResponse(
            { user: formatUserResponse(user!), accessToken },
            skipPassword ? 'Account created! You can set a password later.' : 'Account created successfully!'
        ));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Login Controller
// =============================================================================
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
        if (!user.encrypted_password) {
            throw Errors.passwordNotSet();
        }

        // Verify password
        const isValid = await verifyPassword(password, user.encrypted_password);
        if (!isValid) {
            authLogger.warn({ email, userId: user.id, action: 'login' }, 'Login failed: invalid password');
            throw Errors.invalidCredentials();
        }

        // Update last sign in
        await db
            .update(authUsers)
            .set({ last_sign_in_at: new Date(), updated_at: new Date() })
            .where(eq(authUsers.id, user.id));

        // Create session and get token
        const accessToken = await createSession(user.id, user.email!, req, res);

        // Log activity
        await AdminActivityService.logLogin(user.id);

        const response: LoginResponse = {
            user: formatUserResponse(user),
            message: 'Logged in successfully!',
            accessToken,
        };

        authLogger.info({ email, userId: user.id, action: 'login' }, 'User logged in successfully');
        res.json(successResponse(response));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Google OAuth Initiate
// =============================================================================
export async function googleOAuthInit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const returnTo = validateReturnTo(req.query.returnTo as string);
        const csrfToken = generateSecureToken(16);

        authLogger.info({ csrfTokenPrefix: csrfToken.substring(0, 8) }, 'Google OAuth Init - CSRF token generated');

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
            redirect_uri: config.google.callbackUrl!,
            response_type: 'code',
            scope: 'email profile',
            access_type: 'offline',
            prompt: 'consent',
            state: JSON.stringify({ returnTo, csrfToken }),
        });

        res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Google OAuth Callback
// =============================================================================
export async function googleOAuthCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    // ... logic is mostly existing but we can wrap it securely
    try {
        const { code, state, error } = req.query;

        authLogger.info({ state }, 'Google OAuth Callback received');

        if (error) {
            authLogger.error({ error, action: 'oauth_callback' }, 'Google OAuth error received');
            res.redirect(`${config.frontendUrl}/auth?error=oauth_cancelled`);
            return;
        }

        if (!code || !state) {
            res.redirect(`${config.frontendUrl}/auth?error=oauth_failed`);
            return;
        }

        // Parse and verify state
        const stateData = JSON.parse(state as string);
        const storedCsrf = req.cookies?.oauth_csrf;

        authLogger.info({
            stateCsrfPrefix: stateData.csrfToken?.substring(0, 8),
            storedCsrfPrefix: storedCsrf?.substring(0, 8)
        }, 'Verifying CSRF tokens');

        if (!storedCsrf || stateData.csrfToken !== storedCsrf) {
            authLogger.error({ action: 'oauth_callback' }, 'Google OAuth CSRF mismatch!');
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
                redirect_uri: config.google.callbackUrl!,
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
            if (!user.google_id) {
                await db
                    .update(authUsers)
                    .set({
                        google_id: userInfo.id,
                        is_sso_user: true,
                        updated_at: new Date(),
                    })
                    .where(eq(authUsers.id, user.id));
            }

            // Update last sign in
            await db
                .update(authUsers)
                .set({ last_sign_in_at: new Date(), updated_at: new Date() })
                .where(eq(authUsers.id, user.id));
        } else {
            // Create new user
            const userId = uuidv4();
            await db.insert(authUsers).values({
                id: userId,
                email: userInfo.email.toLowerCase(),
                email_confirmed_at: new Date(),
                provider: 'google',
                google_id: userInfo.id,
                is_sso_user: true,
                raw_user_meta_data: JSON.stringify({
                    name: userInfo.name,
                    given_name: userInfo.given_name,
                    family_name: userInfo.family_name,
                    picture: userInfo.picture,
                }),
                created_at: new Date(),
                updated_at: new Date(),
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
        const expiresAt = getSessionExpiryDate();

        // Store session in database
        await db.insert(authSessions).values({
            id: sessionId,
            user_id: user!.id,
            refresh_token_hash: '',
            user_agent: req.headers['user-agent'] || null,
            ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null,
            expires_at: expiresAt,
        });

        // Generate JWT token (long-lived, matches session duration)
        const token = generateAccessToken(user!.id, user!.email!, sessionId);

        // Redirect to frontend with token in URL (will be exchanged for cookie)
        const returnTo = validateReturnTo(stateData.returnTo);
        authLogger.info({ email: user!.email, userId: user!.id, provider: 'google', action: 'oauth_login' }, 'Google OAuth login successful');

        // Log activity
        await AdminActivityService.logLogin(user!.id);

        res.redirect(`${config.frontendUrl}/auth/callback?token=${encodeURIComponent(token)}&returnTo=${encodeURIComponent(returnTo)}`);
    } catch (err) {
        authLogger.error({ error: (err as Error).message, action: 'oauth_login' }, 'Google OAuth login failed');
        res.redirect(`${config.frontendUrl}/auth?error=oauth_failed`);
        // If it's a critical system error, maybe we should also next(err)?
        // But for OAuth callback, redirecting is usually better UX.
        // However, logging and ensuring no crash is key.
        // This catch block handles it, so it won't crash.
    }
}

// =============================================================================
// Exchange Token for Cookie (called from frontend via proxy)
// =============================================================================
export async function exchangeToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { token } = req.body;

        if (!token) {
            throw Errors.badRequest('Token is required');
        }

        // Simply set the cookie - the token is already valid JWT from OAuth callback
        setAuthCookie(res, token);

        res.json(successResponse({ message: 'Session activated' }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Logout Controller
// =============================================================================
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Get Current User Controller
// =============================================================================
export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Forgot Password Controller
// =============================================================================
export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
            .where(eq(authPasswordResetTokens.user_id, user.id));

        // Generate reset token
        const resetToken = generateSecureToken();
        const tokenHash = await hashToken(resetToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store token
        await db.insert(authPasswordResetTokens).values({
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: expiresAt,
        });

        // Send email
        await sendPasswordResetEmail(user.email!, resetToken);

        authLogger.info({ email, userId: user.id, action: 'forgot_password' }, 'Password reset email sent');
        res.json(successResponse({ message: 'If an account exists with this email, you will receive a password reset link.' }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Reset Password Controller
// =============================================================================
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { token, password } = req.body;

        // Find all non-expired tokens
        const allTokens = await db
            .select()
            .from(authPasswordResetTokens)
            .where(gt(authPasswordResetTokens.expires_at, new Date()));

        // Find the matching token
        let matchedToken = null;
        for (const t of allTokens) {
            if (verifyTokenHash(token, t.token_hash)) {
                matchedToken = t;
                break;
            }
        }

        if (!matchedToken) {
            authLogger.warn({ action: 'reset_password' }, 'Reset password failed: invalid or expired token');
            throw Errors.resetTokenInvalid();
        }

        if (matchedToken.used_at) {
            throw Errors.resetTokenExpired();
        }

        // Update password
        const encryptedPassword = await hashPassword(password);
        await db
            .update(authUsers)
            .set({ encrypted_password: encryptedPassword, updated_at: new Date() })
            .where(eq(authUsers.id, matchedToken.user_id));

        // Mark token as used
        await db
            .update(authPasswordResetTokens)
            .set({ used_at: new Date() })
            .where(eq(authPasswordResetTokens.id, matchedToken.id));

        // Invalidate all sessions
        await db
            .delete(authSessions)
            .where(eq(authSessions.user_id, matchedToken.user_id));
        authLogger.info({ userId: matchedToken.user_id, action: 'reset_password' }, 'Password reset successfully, all sessions invalidated');
        res.json(successResponse({ message: 'Password reset successfully. Please log in with your new password.' }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Set Password Controller (for Google users)
// =============================================================================
export async function setPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.user) {
            throw Errors.unauthorized();
        }

        const { password } = req.body;

        const encryptedPassword = await hashPassword(password);
        await db
            .update(authUsers)
            .set({ encrypted_password: encryptedPassword, updated_at: new Date() })
            .where(eq(authUsers.id, req.user.userId));

        res.json(successResponse({ message: 'Password set successfully. You can now login with email and password.' }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Resend OTP Controller
// =============================================================================
export async function resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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

        // Check cooldown (30 seconds)
        const createdAt = pendingSignup.created_at!;
        const secondsSinceCreated = (Date.now() - createdAt.getTime()) / 1000;
        if (secondsSinceCreated < 30) {
            const waitSeconds = Math.ceil(30 - secondsSinceCreated);
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
                otp_hash: otpHash,
                expires_at: expiresAt,
                created_at: new Date(),
                attempts: '0',
            })
            .where(eq(authPendingSignups.id, pendingSignup.id));

        // Send new OTP
        await sendOtpEmail(email.toLowerCase(), otp);

        res.json(successResponse({
            pending_signup_id: pendingSignup.id,
            expires_at: expiresAt.toISOString(),
            message: 'New verification code sent.',
        }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Check Pending Signup Controller
// =============================================================================
export async function checkPendingSignup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { pendingSignupId } = req.body;

        const [pendingSignup] = await db
            .select()
            .from(authPendingSignups)
            .where(
                and(
                    eq(authPendingSignups.id, pendingSignupId),
                    gt(authPendingSignups.expires_at, new Date())
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
            expires_at: pendingSignup.expires_at.toISOString(),
        };

        res.json(successResponse(response));
    } catch (error) {
        next(error);
    }
}



// =============================================================================
// Cleanup Expired Data (can be called by cron)
// =============================================================================
export async function cleanupExpired(): Promise<void> {
    const now = new Date();

    // Delete expired pending signups
    await db
        .delete(authPendingSignups)
        .where(lt(authPendingSignups.expires_at, now));

    // Delete expired password reset tokens
    await db
        .delete(authPasswordResetTokens)
        .where(lt(authPasswordResetTokens.expires_at, now));

    // Delete expired sessions
    await db
        .delete(authSessions)
        .where(lt(authSessions.expires_at, now));

    console.log('[Cleanup] Expired data cleaned up');
}