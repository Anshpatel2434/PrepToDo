import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// =============================================================================
// Environment Configuration with Validation
// =============================================================================
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'TURNSTILE_SECRET_KEY',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'FRONTEND_URL',
] as const;

// Validate required environment variables
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing required environment variable: ${envVar}`);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
}

export const config = {
    // Server
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',

    // Database
    databaseUrl: process.env.DATABASE_URL!,

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET!,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        cookieName: 'preptodo_token',
        refreshCookieName: 'preptodo_refresh',
    },

    // Google OAuth
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
    },

    // Cloudflare Turnstile
    turnstile: {
        secretKey: process.env.TURNSTILE_SECRET_KEY!,
        verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    },

    // SMTP (Gmail)
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER!,
        password: process.env.SMTP_PASSWORD!,
        fromName: process.env.SMTP_FROM_NAME || 'PrepToDo',
        fromEmail: process.env.SMTP_USER!,
    },

    // URLs
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',

    // Rate Limiting
    rateLimit: {
        login: {
            maxAttempts: 5,
            windowMs: 15 * 60 * 1000, // 15 minutes
        },
        otp: {
            maxAttempts: 3,
            windowMs: 10 * 60 * 1000, // 10 minutes
        },
        general: {
            maxRequests: 100,
            windowMs: 15 * 60 * 1000, // 15 minutes
        },
    },

    // OTP Settings
    otp: {
        length: 6,
        expiresInMinutes: 10,
    },

    // Password Reset
    passwordReset: {
        expiresInMinutes: 60,
    },

    // Pending Signup (for refresh persistence)
    pendingSignup: {
        expiresInMinutes: 30,
    },
} as const;

export type Config = typeof config;
