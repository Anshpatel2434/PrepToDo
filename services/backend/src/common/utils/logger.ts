// =============================================================================
// Pino Logger Configuration
// =============================================================================
import pino from 'pino';
import { config } from '../../config/index.js';

// Redact sensitive fields from logs
const redactFields = [
    'password',
    'encryptedPassword',
    'token',
    'refreshToken',
    'otp',
    'otpHash',
    'cookie',
    'authorization',
    'captchaToken',
];

// Create logger instance
export const logger = pino({
    level: config.isProduction ? 'info' : 'debug',

    // Redact sensitive data
    redact: {
        paths: redactFields.map(field => `*.${field}`),
        censor: '[REDACTED]',
    },

    // Pretty print in development
    transport: config.isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
            },
        },

    // Base context for all logs
    base: {
        env: config.isProduction ? 'production' : 'development',
    },
});

// =============================================================================
// Child Logger Factory
// =============================================================================
export function createChildLogger(context: string) {
    return logger.child({ context });
}

// =============================================================================
// Pre-configured Context Loggers
// =============================================================================
export const authLogger = createChildLogger('auth');
export const dbLogger = createChildLogger('database');
export const httpLogger = createChildLogger('http');