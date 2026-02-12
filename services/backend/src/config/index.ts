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
    'TURNSTILE_SECRET_KEY',
    'RESEND_API_KEY',
    'DEV_FRONTEND_URL',
    'PROD_FRONTEND_URL',
    'DEV_BACKEND_URL',
    'PROD_BACKEND_URL',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD_HASH',
    'ADMIN_JWT_SECRET',
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
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        cookieName: 'preptodo_token',
        refreshCookieName: 'preptodo_refresh',
    },

    // Google OAuth
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackUrl: process.env.NODE_ENV === 'production' ? process.env.PROD_GOOGLE_CALLBACK_URL : process.env.DEV_GOOGLE_CALLBACK_URL,
    },

    // Cloudflare Turnstile
    turnstile: {
        secretKey: process.env.TURNSTILE_SECRET_KEY!,
        verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    },

    // Resend Email
    resend: {
        apiKey: process.env.RESEND_API_KEY!,
        fromName: process.env.EMAIL_FROM_NAME || 'PrepToDo',
        fromEmail: process.env.EMAIL_FROM_ADDRESS || 'preptodo.app@gmail.com',
    },

    // URLs
    frontendUrl: process.env.NODE_ENV === 'production' ? process.env.PROD_FRONTEND_URL : process.env.DEV_FRONTEND_URL,
    backendUrl: process.env.NODE_ENV === 'production' ? process.env.PROD_BACKEND_URL : process.env.DEV_BACKEND_URL,

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

    // Admin Panel
    admin: {
        email: process.env.ADMIN_EMAIL!,
        passwordHash: process.env.ADMIN_PASSWORD_HASH!,
        jwtSecret: process.env.ADMIN_JWT_SECRET!,
        jwtExpiresIn: '1h',
        cookieName: 'preptodo_admin_token',
    },
} as const;

export type Config = typeof config;
