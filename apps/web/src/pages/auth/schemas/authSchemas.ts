import { z } from "zod";

// ============================================================================
// Email Validation
// ============================================================================
export const EmailSchema = z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(254, "Email is too long")
    .toLowerCase()
    .trim();

// ============================================================================
// OTP Validation (8-digit as configured in Supabase)
// ============================================================================
export const OtpSchema = z
    .string()
    .length(8, "OTP must be 8 digits")
    .regex(/^\d+$/, "OTP must contain only numbers");

// ============================================================================
// Password Validation with Complexity Requirements
// ============================================================================
export const PasswordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number");

// ============================================================================
// Request Schemas
// ============================================================================
export const SignupEmailRequestSchema = z.object({
    email: EmailSchema,
    captchaToken: z.string().optional(),
});

export const VerifyOtpRequestSchema = z.object({
    email: EmailSchema,
    token: OtpSchema,
});

export const UpdatePasswordRequestSchema = z.object({
    newPassword: PasswordSchema,
});

export const LoginRequestSchema = z.object({
    email: EmailSchema,
    password: z.string().min(1, "Password is required"),
});

// ============================================================================
// Type Exports
// ============================================================================
export type SignupEmailRequest = z.infer<typeof SignupEmailRequestSchema>;
export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;
export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// ============================================================================
// Validation Helper
// ============================================================================
export function validateAuthInput<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        error: result.error.issues[0]?.message || "Validation failed",
    };
}
