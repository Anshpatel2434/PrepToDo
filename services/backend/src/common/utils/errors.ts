// =============================================================================
// Standardized Error Response Types
// =============================================================================
// These codes are used for frontend error handling and toaster messages

export const ErrorCodes = {
    // Authentication Errors
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    EMAIL_NOT_FOUND: 'EMAIL_NOT_FOUND',
    EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
    INVALID_EMAIL: 'INVALID_EMAIL',
    EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
    PASSWORD_NOT_SET: 'PASSWORD_NOT_SET',
    WEAK_PASSWORD: 'WEAK_PASSWORD',

    // OTP Errors
    INVALID_OTP: 'INVALID_OTP',
    OTP_EXPIRED: 'OTP_EXPIRED',
    OTP_ALREADY_SENT: 'OTP_ALREADY_SENT',

    // Session Errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',

    // Rate Limiting
    RATE_LIMITED: 'RATE_LIMITED',

    // CAPTCHA
    CAPTCHA_FAILED: 'CAPTCHA_FAILED',
    CAPTCHA_REQUIRED: 'CAPTCHA_REQUIRED',

    // Password Reset
    RESET_TOKEN_INVALID: 'RESET_TOKEN_INVALID',
    RESET_TOKEN_EXPIRED: 'RESET_TOKEN_EXPIRED',

    // OAuth Errors
    OAUTH_FAILED: 'OAUTH_FAILED',
    OAUTH_EMAIL_MISMATCH: 'OAUTH_EMAIL_MISMATCH',

    // Pending Signup
    PENDING_SIGNUP_NOT_FOUND: 'PENDING_SIGNUP_NOT_FOUND',
    PENDING_SIGNUP_EXPIRED: 'PENDING_SIGNUP_EXPIRED',

    // Admin Panel
    ADMIN_UNAUTHORIZED: 'ADMIN_UNAUTHORIZED',
    ADMIN_FORBIDDEN: 'ADMIN_FORBIDDEN',
    ADMIN_INVALID_QUERY: 'ADMIN_INVALID_QUERY',

    // General Errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    BAD_REQUEST: 'BAD_REQUEST',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// =============================================================================
// Error Messages - User-Friendly Messages for Toasters
// =============================================================================
export const ErrorMessages: Record<ErrorCode, string> = {
    // Authentication
    INVALID_CREDENTIALS: 'The email or password you entered is incorrect. Please double-check and try again.',
    EMAIL_NOT_FOUND: 'No account found with this email address.',
    EMAIL_ALREADY_EXISTS: 'An account with this email already exists. Please sign in instead.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    EMAIL_NOT_VERIFIED: 'Please verify your email before signing in.',
    PASSWORD_NOT_SET: 'This account uses Google sign-in. Please use "Continue with Google" or set a password first.',
    WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and numbers.',

    // OTP
    INVALID_OTP: 'That code doesn\'t match. Please check the 6-digit code from your email and try again.',
    OTP_EXPIRED: 'This code has expired. Click "Resend Code" to get a new one.',
    OTP_ALREADY_SENT: 'A verification code was already sent. Please check your email or wait before requesting a new one.',

    // Session
    UNAUTHORIZED: 'Please sign in to continue.',
    SESSION_EXPIRED: 'You\'ve been signed out because your session expired. Please sign in again.',
    INVALID_TOKEN: 'Your session is invalid. Please sign in again.',

    // Rate Limiting
    RATE_LIMITED: 'Too many attempts. Please wait a few minutes and try again.',

    // CAPTCHA
    CAPTCHA_FAILED: 'Security check failed. Please refresh the page and try again.',
    CAPTCHA_REQUIRED: 'Please complete the security verification to continue.',

    // Password Reset
    RESET_TOKEN_INVALID: 'This password reset link is invalid or has already been used.',
    RESET_TOKEN_EXPIRED: 'This password reset link has expired. Please request a new one.',

    // OAuth
    OAUTH_FAILED: 'Google sign-in failed. Please try again.',
    OAUTH_EMAIL_MISMATCH: 'Email address does not match the expected account.',

    // Pending Signup
    PENDING_SIGNUP_NOT_FOUND: 'Your signup session was not found. Please go back and start the sign-up process again.',
    PENDING_SIGNUP_EXPIRED: 'Your signup session has expired due to too many failed attempts. Please start the sign-up process again.',

    // Admin Panel
    ADMIN_UNAUTHORIZED: 'Admin authentication required.',
    ADMIN_FORBIDDEN: 'You do not have admin access.',
    ADMIN_INVALID_QUERY: 'The SQL query is invalid or contains unsafe operations.',

    // General
    VALIDATION_ERROR: 'Please check your input and try again.',
    INTERNAL_ERROR: 'Something went wrong on our end. Please try again later.',
    NOT_FOUND: 'The requested resource was not found.',
    BAD_REQUEST: 'Invalid request. Please try again.',
};

// =============================================================================
// API Error Class
// =============================================================================
export class ApiError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly details?: Record<string, unknown>;

    constructor(
        code: ErrorCode,
        statusCode: number = 400,
        customMessage?: string,
        details?: Record<string, unknown>
    ) {
        super(customMessage || ErrorMessages[code]);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'ApiError';

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                ...(this.details && { details: this.details }),
            },
        };
    }
}

// =============================================================================
// Success Response Helper
// =============================================================================
export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
    message?: string;
}

export function successResponse<T>(data: T, message?: string): ApiSuccessResponse<T> {
    return {
        success: true,
        data,
        ...(message && { message }),
    };
}

// =============================================================================
// Common Error Factories
// =============================================================================
export const Errors = {
    // Auth
    invalidCredentials: () => new ApiError(ErrorCodes.INVALID_CREDENTIALS, 401),
    emailNotFound: () => new ApiError(ErrorCodes.EMAIL_NOT_FOUND, 404),
    emailAlreadyExists: () => new ApiError(ErrorCodes.EMAIL_ALREADY_EXISTS, 409),
    invalidEmail: (details?: string) =>
        new ApiError(ErrorCodes.INVALID_EMAIL, 400, details || ErrorMessages.INVALID_EMAIL),
    emailNotVerified: () => new ApiError(ErrorCodes.EMAIL_NOT_VERIFIED, 403),
    passwordNotSet: () => new ApiError(ErrorCodes.PASSWORD_NOT_SET, 400),
    weakPassword: () => new ApiError(ErrorCodes.WEAK_PASSWORD, 400),

    // OTP
    invalidOtp: () => new ApiError(ErrorCodes.INVALID_OTP, 400),
    otpExpired: () => new ApiError(ErrorCodes.OTP_EXPIRED, 400),
    otpAlreadySent: () => new ApiError(ErrorCodes.OTP_ALREADY_SENT, 429),

    // Session
    unauthorized: () => new ApiError(ErrorCodes.UNAUTHORIZED, 401),
    sessionExpired: () => new ApiError(ErrorCodes.SESSION_EXPIRED, 401),
    invalidToken: () => new ApiError(ErrorCodes.INVALID_TOKEN, 401),

    // Rate Limiting
    rateLimited: (retryAfterSeconds?: number) =>
        new ApiError(
            ErrorCodes.RATE_LIMITED,
            429,
            retryAfterSeconds
                ? `Too many attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`
                : ErrorMessages.RATE_LIMITED
        ),

    // CAPTCHA
    captchaFailed: () => new ApiError(ErrorCodes.CAPTCHA_FAILED, 400),
    captchaRequired: () => new ApiError(ErrorCodes.CAPTCHA_REQUIRED, 400),

    // Password Reset
    resetTokenInvalid: () => new ApiError(ErrorCodes.RESET_TOKEN_INVALID, 400),
    resetTokenExpired: () => new ApiError(ErrorCodes.RESET_TOKEN_EXPIRED, 400),

    // OAuth
    oauthFailed: (details?: string) =>
        new ApiError(ErrorCodes.OAUTH_FAILED, 400, details || ErrorMessages.OAUTH_FAILED),

    // Pending Signup
    pendingSignupNotFound: () => new ApiError(ErrorCodes.PENDING_SIGNUP_NOT_FOUND, 404),
    pendingSignupExpired: () => new ApiError(ErrorCodes.PENDING_SIGNUP_EXPIRED, 400),

    // Admin Panel
    adminUnauthorized: () => new ApiError(ErrorCodes.ADMIN_UNAUTHORIZED, 401),
    adminForbidden: () => new ApiError(ErrorCodes.ADMIN_FORBIDDEN, 403),
    adminInvalidQuery: (details?: string) =>
        new ApiError(ErrorCodes.ADMIN_INVALID_QUERY, 400, details),

    // General
    validationError: (details?: Record<string, unknown>) =>
        new ApiError(ErrorCodes.VALIDATION_ERROR, 400, undefined, details),
    internalError: () => new ApiError(ErrorCodes.INTERNAL_ERROR, 500),
    notFound: (resource?: string) =>
        new ApiError(ErrorCodes.NOT_FOUND, 404, resource ? `${resource} not found.` : undefined),
    badRequest: (message?: string) =>
        new ApiError(ErrorCodes.BAD_REQUEST, 400, message || ErrorMessages.BAD_REQUEST),
};
