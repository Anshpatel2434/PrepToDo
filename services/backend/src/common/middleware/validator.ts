import type { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

// =============================================================================
// Validation Middleware Factory
// =============================================================================
export const validate = <T extends ZodSchema>(schema: T) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const result = schema.safeParse(req.body);

            if (!result.success) {
                // Extract first error message for user-friendly display
                const firstError = result.error.errors[0];
                const errorMessage = firstError?.message || 'Invalid input';
                const errorPath = firstError?.path?.join('.') || 'input';

                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: errorMessage,
                        field: errorPath,
                        details: result.error.errors.map(e => ({
                            field: e.path.join('.'),
                            message: e.message,
                        })),
                    },
                });
                return;
            }

            // Replace body with parsed data (includes transformations)
            req.body = result.data;
            next();
        } catch (error) {
            next(error);
        }
    };
};

// =============================================================================
// Common Validation Schemas
// =============================================================================

// Email validation with proper regex and transformation
export const emailSchema = z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email is too long')
    .toLowerCase()
    .trim();

// Password validation with complexity requirements
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

// UUID validation
export const uuidSchema = z
    .string()
    .uuid('Invalid ID format');
