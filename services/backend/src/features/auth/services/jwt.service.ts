// =============================================================================
// Auth Feature - JWT Service
// =============================================================================
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../../../config/index.js';
import { db } from '../../../db/index.js';
import { authSessions } from '../../../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

// =============================================================================
// JWT Payload Type
// =============================================================================
export interface JwtPayload {
    userId: string;
    email: string;
    sessionId: string;
    iat?: number;
    exp?: number;
}

// =============================================================================
// Generate Access Token
// =============================================================================
export function generateAccessToken(
    userId: string,
    email: string,
    sessionId: string
): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        userId,
        email,
        sessionId,
    };

    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.accessExpiresIn,
    } as jwt.SignOptions);
}

// =============================================================================
// Verify Access Token (Fast - JWT Signature Only)
// =============================================================================
// This is the PRIMARY verification method. It only checks:
// 1. JWT signature is valid (token wasn't tampered with)
// 2. Token hasn't expired (exp claim)
// 
// This is the standard JWT pattern - we trust the token if it's valid and not expired.
// Session invalidation is handled by short token expiry + refresh token mechanism.
// =============================================================================
export function verifyAccessToken(token: string): JwtPayload | null {
    try {
        const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
        return payload;
    } catch {
        return null;
    }
}

// =============================================================================
// Verify Access Token WITH Session Check (Slow - Uses DB)
// =============================================================================
// Use this ONLY when you need to guarantee the session is still valid in DB:
// - Logout operations
// - Password changes
// - Critical security operations
// - Token refresh
// =============================================================================
export async function verifyAccessTokenWithSession(token: string): Promise<JwtPayload | null> {
    try {
        const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;

        // Verify session still exists and is not expired in database
        const session = await db
            .select()
            .from(authSessions)
            .where(
                and(
                    eq(authSessions.id, payload.sessionId),
                    eq(authSessions.user_id, payload.userId),
                    gt(authSessions.expires_at, new Date())
                )
            )
            .limit(1);

        if (session.length === 0) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}

// =============================================================================
// Decode Token Without Verification
// =============================================================================
export function decodeToken(token: string): JwtPayload | null {
    try {
        return jwt.decode(token) as JwtPayload;
    } catch {
        return null;
    }
}

// =============================================================================
// Verify Access Token (Fast - No DB Call)
// Use this for non-critical endpoints where token validity check is sufficient
// =============================================================================
export function verifyAccessTokenFast(token: string): JwtPayload | null {
    try {
        const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
        return payload;
    } catch {
        return null;
    }
}