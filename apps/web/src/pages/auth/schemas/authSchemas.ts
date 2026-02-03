import { z } from "zod";

// =============================================================================
// Email Schema
// =============================================================================
export const EmailSchema = z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(254, "Email is too long")
    .toLowerCase()
    .trim();

// =============================================================================
// Password Schema (with strength requirements)
// =============================================================================
export const PasswordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number");

// =============================================================================
// OTP Schema (6 digits)
// =============================================================================
export const OtpSchema = z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers");

// =============================================================================
// Login Schema
// =============================================================================
export const LoginSchema = z.object({
    email: EmailSchema,
    password: z.string().min(1, "Password is required"),
});

// =============================================================================
// Signup Email Step Schema
// =============================================================================
export const SignupEmailSchema = z.object({
    email: EmailSchema,
});

// =============================================================================
// Signup OTP Step Schema
// =============================================================================
export const SignupOtpSchema = z.object({
    email: EmailSchema,
    otp: OtpSchema,
});

// =============================================================================
// Signup Password Step Schema
// =============================================================================
export const SignupPasswordSchema = z.object({
    password: PasswordSchema,
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// =============================================================================
// Forgot Password Schema
// =============================================================================
export const ForgotPasswordSchema = z.object({
    email: EmailSchema,
});

// =============================================================================
// Reset Password Schema
// =============================================================================
export const ResetPasswordSchema = z.object({
    password: PasswordSchema,
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// =============================================================================
// Password Strength Calculator
// =============================================================================
export function calculatePasswordStrength(password: string): {
    score: number; // 0-4
    label: string;
    color: string;
} {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    // Normalize to 0-4
    score = Math.min(4, score);

    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

    return {
        score,
        label: labels[score],
        color: colors[score],
    };
}

// =============================================================================
// Type Exports
// =============================================================================
export type EmailSchemaType = z.infer<typeof EmailSchema>;
export type PasswordSchemaType = z.infer<typeof PasswordSchema>;
export type OtpSchemaType = z.infer<typeof OtpSchema>;
export type LoginSchemaType = z.infer<typeof LoginSchema>;
export type SignupEmailSchemaType = z.infer<typeof SignupEmailSchema>;
export type SignupOtpSchemaType = z.infer<typeof SignupOtpSchema>;
export type SignupPasswordSchemaType = z.infer<typeof SignupPasswordSchema>;
export type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordSchemaType = z.infer<typeof ResetPasswordSchema>;
