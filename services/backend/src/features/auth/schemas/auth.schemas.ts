// =============================================================================
// Auth Feature - Validation Schemas
// =============================================================================
import { z } from 'zod';
import { emailSchema, passwordSchema, validate } from '../../../common/middleware/validator.js';

// =============================================================================
// Auth-Specific Schemas
// =============================================================================

// OTP validation (6 digits)
export const otpSchema = z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only numbers');

// Pending signup ID
export const pendingSignupIdSchema = z
    .string()
    .uuid('Invalid signup session');

// =============================================================================
// Request Schemas
// =============================================================================

export const checkEmailSchema = z.object({
    email: emailSchema,
    captchaToken: z.string().optional(),
});

export const sendOtpSchema = z.object({
    email: emailSchema,
    captchaToken: z.string().optional(),
});

export const verifyOtpSchema = z.object({
    email: emailSchema,
    otp: otpSchema,
    pendingSignupId: pendingSignupIdSchema.optional(),
});

export const completeSignupSchema = z.object({
    email: emailSchema,
    pendingSignupId: pendingSignupIdSchema,
    password: passwordSchema.optional(),
    skipPassword: z.boolean().optional(),
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
    captchaToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
    email: emailSchema,
    captchaToken: z.string().optional(),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
});

export const setPasswordSchema = z.object({
    password: passwordSchema,
});

export const resendOtpSchema = z.object({
    email: emailSchema,
    pendingSignupId: pendingSignupIdSchema,
});

export const checkPendingSignupSchema = z.object({
    pendingSignupId: pendingSignupIdSchema,
});

// =============================================================================
// Validation Middleware Exports
// =============================================================================
export const validateCheckEmail = validate(checkEmailSchema);
export const validateSendOtp = validate(sendOtpSchema);
export const validateVerifyOtp = validate(verifyOtpSchema);
export const validateCompleteSignup = validate(completeSignupSchema);
export const validateLogin = validate(loginSchema);
export const validateForgotPassword = validate(forgotPasswordSchema);
export const validateResetPassword = validate(resetPasswordSchema);
export const validateSetPassword = validate(setPasswordSchema);
export const validateResendOtp = validate(resendOtpSchema);
export const validateCheckPendingSignup = validate(checkPendingSignupSchema);
