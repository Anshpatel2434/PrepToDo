// =============================================================================
// Admin Feature - Users Controller
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../../db/index.js';
import { users, practiceSessions } from '../../../db/schema.js';
import { eq, desc, sql, like, or } from 'drizzle-orm';
import { successResponse, Errors } from '../../../common/utils/errors.js';

// =============================================================================
// Get Users List (Paginated + Search)
// =============================================================================
export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const offset = (page - 1) * limit;

        // Build where clause
        const whereClause = search
            ? like(users.email, `%${search}%`)
            : undefined;

        // Parallel fetch count and data
        const [totalCountRes, usersList] = await Promise.all([
            db.select({ count: sql<number>`count(*)` })
                .from(users)
                .where(whereClause),

            db.query.users.findMany({
                where: whereClause,
                limit,
                offset,
                orderBy: [desc(users.created_at)],
                columns: {
                    id: true,
                    email: true,
                    // full_name: true, // Not in users table, available in profile
                    role: true, // might not exist in type if not in schema? Check schema.
                    // is_verified: true, // check schema
                    created_at: true,
                    last_sign_in_at: true
                },
                with: {
                    profile: {
                        columns: { display_name: true }
                    }
                }
            })
        ]);

        const total = Number(totalCountRes[0].count);

        res.json(successResponse({
            users: usersList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Get Single User Details
// =============================================================================
export async function getUserDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { id } = req.params;

        const user = await db.query.users.findFirst({
            where: eq(users.id, id as string),
            with: {
                // Fetch recent sessions
                practiceSessions: {
                    limit: 5,
                    orderBy: [desc(practiceSessions.created_at)]
                }
            }
        });

        if (!user) {
            throw Errors.notFound('User');
        }

        res.json(successResponse({ user }));
    } catch (error) {
        next(error);
    }
}
