// =============================================================================
// Admin Feature - Dashboard Controller
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../../db/index.js';
import { adminPlatformMetricsDaily, adminAiCostLog, users, practiceSessions } from '../../../db/schema.js';
import { eq, desc, sql, gte, and } from 'drizzle-orm';
import { successResponse } from '../../../common/utils/errors.js';
import { createChildLogger } from '../../../common/utils/logger.js';

const logger = createChildLogger('admin-dashboard');

// =============================================================================
// Get Dashboard Overview Metrics
// =============================================================================
export async function getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        // Parallelize queries for performance
        const [
            totalUsers,
            totalSessions,
            totalRevenue,
            recentActivity,
            costToday
        ] = await Promise.all([
            // 1. Total Users
            db.select({ count: sql<number>`count(*)` }).from(users).then(res => Number(res[0].count)),

            // 2. Total Sessions
            db.select({ count: sql<number>`count(*)` }).from(practiceSessions).then(res => Number(res[0].count)),

            // 3. Revenue (Mock - replace with real Stripe data later)
            // For now, let's assume 0 or fetch from a payments table if exists (doesn't exist yet in schema provided)
            Promise.resolve(0),

            // 4. Recent Activity (Last 5 events)
            // We can query practice sessions as a proxy for activity if admin_user_activity_log is empty
            db.query.practiceSessions.findMany({
                orderBy: [desc(practiceSessions.created_at)],
                limit: 5,
                with: {
                    user: {
                        columns: {
                            email: true,
                            display_name: true
                        }
                    }
                }
            }),

            // 5. AI Cost Today
            // Aggregate from admin_ai_cost_log for today
            db.select({
                totalCost: sql<number>`sum(cost_cents)`
            })
                .from(adminAiCostLog)
                .where(
                    gte(adminAiCostLog.created_at, new Date(new Date().setHours(0, 0, 0, 0)))
                )
                .then(res => Number(res[0]?.totalCost || 0))
        ]);

        res.json(successResponse({
            metrics: {
                totalUsers,
                totalSessions,
                totalRevenueCents: totalRevenue,
                dailyActiveUsers: 0, // TODO: Implement tracking
                aiCostTodayCents: costToday
            },
            recentActivity: recentActivity.map(session => ({
                type: 'session_started',
                user: session.user.email,
                details: `Started ${session.paper_id ? 'exam' : 'practice'} session`,
                time: session.created_at
            }))
        }));

    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Get Platform Metrics History (Chart Data)
// =============================================================================
export async function getMetricsHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        // Fetch last 30 days of metrics
        const history = await db.query.adminPlatformMetricsDaily.findMany({
            orderBy: [desc(adminPlatformMetricsDaily.date)],
            limit: 30
        });

        // If no history exists yet (start of project), generate dummy data or return empty
        // Returning empty for now

        res.json(successResponse({
            history: history.reverse() // Oldest to newest for charts
        }));
    } catch (error) {
        next(error);
    }
}
