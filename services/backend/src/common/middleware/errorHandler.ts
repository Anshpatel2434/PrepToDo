import type { Request, Response, NextFunction } from 'express';
import { ApiError, ErrorCodes } from '../utils/errors.js';
import { config } from '../../config/index.js';
import { logger } from '../utils/logger.js';

// =============================================================================
// Global Error Handler
// =============================================================================
export const errorHandler = (
    error: Error | ApiError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Log error with context
    logger.error({
        errorName: error.name,
        errorMessage: error.message,
        path: req.path,
        method: req.method,
        ...(config.isDevelopment && { stack: error.stack }),
    }, 'Request error');

    // Handle ApiError
    if (error instanceof ApiError) {
        res.status(error.statusCode).json(error.toJSON());
        return;
    }

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
        res.status(400).json({
            success: false,
            error: {
                code: ErrorCodes.VALIDATION_ERROR,
                message: 'Please check your input and try again.',
                details: (error as any).errors,
            },
        });
        return;
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            error: {
                code: ErrorCodes.INVALID_TOKEN,
                message: 'Invalid authentication token.',
            },
        });
        return;
    }

    if (error.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            error: {
                code: ErrorCodes.SESSION_EXPIRED,
                message: 'Your session has expired. Please log in again.',
            },
        });
        return;
    }

    // Handle database errors
    if (error.message?.includes('unique constraint')) {
        res.status(409).json({
            success: false,
            error: {
                code: ErrorCodes.EMAIL_ALREADY_EXISTS,
                message: 'An account with this email already exists.',
            },
        });
        return;
    }

    // Default to internal server error
    res.status(500).json({
        success: false,
        error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'Something went wrong. Please try again later.',
            ...(config.isDevelopment && { debug: error.message }),
        },
    });
};

// =============================================================================
// Not Found Handler
// =============================================================================
export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        error: {
            code: ErrorCodes.NOT_FOUND,
            message: `Route ${req.method} ${req.path} not found.`,
        },
    });
};
