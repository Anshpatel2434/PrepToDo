// =============================================================================
// Auth Feature - Password Service
// =============================================================================
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

// =============================================================================
// Password Hashing
// =============================================================================
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

// =============================================================================
// Secure Token Generation
// =============================================================================
export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

export async function hashToken(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyTokenHash(token: string, hashedToken: string): boolean {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hashedToken));
}
