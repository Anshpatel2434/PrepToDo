// =============================================================================
// Admin Feature - System Controller
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../../db/index.js';
import { adminUserActivityLog } from '../../../db/schema.js';
import { desc, sql, like, or } from 'drizzle-orm';
import { successResponse } from '../../../common/utils/errors.js';

// =============================================================================
// Get Activity Logs
// =============================================================================
export async function getActivityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        // Fetch logs (admin_user_activity_log)
        // Note: admin_user_activity_log might not be populated heavily yet, 
        // as we haven't added specific triggers for it in other parts of the app,
        // but it's good to expose it.

        const [totalCountRes, logs] = await Promise.all([
            db.select({ count: sql<number>`count(*)` })
                .from(adminUserActivityLog),

            db.query.adminUserActivityLog.findMany({
                limit,
                offset,
                orderBy: [desc(adminUserActivityLog.created_at)],
                with: {
                    user: {
                        columns: { email: true },
                        with: {
                            profile: {
                                columns: { display_name: true }
                            }
                        }
                    }
                }
            })
        ]);

        const total = Number(totalCountRes[0].count);

        res.json(successResponse({
            logs,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }));
    } catch (error) {
        next(error);
    }
}
