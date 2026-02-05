// =============================================================================
// Express Validator Middleware
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Errors } from '../utils/errors.js';

/**
 * Middleware to check express-validator validation results
 * Use after express-validator validation chains
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const firstError: any = errors.array()[0];
        throw Errors.badRequest(
            `Validation failed for field '${firstError.path || firstError.param}': ${firstError.msg}`
        );
    }

    next();
};
