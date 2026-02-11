// =============================================================================
// Admin Feature - JWT Service
// =============================================================================
import jwt from 'jsonwebtoken';
import { config } from '../../../config/index.js';

// =============================================================================
// Admin JWT Payload Type
// =============================================================================
export interface AdminJwtPayload {
    email: string;
    role: 'admin';
    iat?: number;
    exp?: number;
}

// =============================================================================
// Generate Admin Access Token
// =============================================================================
export function generateAdminToken(email: string): string {
    const payload: Omit<AdminJwtPayload, 'iat' | 'exp'> = {
        email,
        role: 'admin',
    };

    return jwt.sign(payload, config.admin.jwtSecret, {
        expiresIn: config.admin.jwtExpiresIn,
    } as jwt.SignOptions);
}

// =============================================================================
// Verify Admin Access Token
// =============================================================================
export function verifyAdminToken(token: string): AdminJwtPayload | null {
    try {
        const payload = jwt.verify(token, config.admin.jwtSecret) as AdminJwtPayload;
        return payload;
    } catch {
        return null;
    }
}
