// =============================================================================
// Auth Feature - JWT Service
// =============================================================================
import jwt from 'jsonwebtoken';
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
        expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
}

// =============================================================================
// Verify Access Token
// =============================================================================
export async function verifyAccessToken(token: string): Promise<JwtPayload | null> {
    try {
        const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;

        // Verify session still exists and is not expired
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
