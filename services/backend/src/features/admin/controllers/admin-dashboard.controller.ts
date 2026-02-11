// =============================================================================
// Admin Feature - Dashboard Controller
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../../db/index.js';
import { adminPlatformMetricsDaily, adminAiCostLog, users, practiceSessions, authSessions } from '../../../db/schema.js';
import { eq, desc, sql, gte, and } from 'drizzle-orm';
import { successResponse } from '../../../common/utils/errors.js';
import { createChildLogger } from '../../../common/utils/logger.js';

const logger = createChildLogger('admin-dashboard');

// =============================================================================
// Get Dashboard Overview Metrics
// =============================================================================
export async function getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Parallelize all queries for performance
        const [
            totalUsers,
            newUsersToday,
            dailyActiveUsers,
            totalSessions,
            costToday,
            costTotal,
            topSpendingUsers,
            newLoginsToday,
            recentSessions,
            avgCostPerUserData,
        ] = await Promise.all([
            // 1. Total Users
            db.select({ count: sql<number>`count(*)` }).from(users)
                .then(res => Number(res[0].count)),

            // 2. New Users Today
            db.select({ count: sql<number>`count(*)` }).from(users)
                .where(gte(users.created_at, todayStart))
                .then(res => Number(res[0].count)),

            // 3. Daily Active Users (users who logged in within last 7 days)
            db.select({ count: sql<number>`count(*)` }).from(users)
                .where(gte(users.last_sign_in_at, sevenDaysAgo))
                .then(res => Number(res[0].count)),

            // 4. Total Sessions
            db.select({ count: sql<number>`count(*)` }).from(practiceSessions)
                .then(res => Number(res[0].count)),

            // 5. AI Cost Today
            db.select({ totalCost: sql<number>`COALESCE(sum(cost_cents), 0)` })
                .from(adminAiCostLog)
                .where(gte(adminAiCostLog.created_at, todayStart))
                .then(res => Number(res[0]?.totalCost || 0)),

            // 6. AI Cost Total (Lifetime)
            db.select({ totalCost: sql<number>`COALESCE(sum(cost_cents), 0)` })
                .from(adminAiCostLog)
                .then(res => Number(res[0]?.totalCost || 0)),

            // 7. Top Spending Users (top 10 by AI cost)
            db.select({
                userId: adminAiCostLog.user_id,
                totalCost: sql<number>`COALESCE(sum(cost_cents), 0)`,
                callCount: sql<number>`count(*)`,
            })
                .from(adminAiCostLog)
                .where(sql`${adminAiCostLog.user_id} IS NOT NULL`)
                .groupBy(adminAiCostLog.user_id)
                .orderBy(desc(sql`sum(cost_cents)`))
                .limit(10),

            // 8. New Logins Today (from auth_sessions table)
            db.select({ count: sql<number>`count(*)` }).from(authSessions)
                .where(gte(authSessions.created_at, todayStart))
                .then(res => Number(res[0].count)),

            // 9. Recent Sessions (last 5 — use direct select to avoid relation issues)
            db.select({
                id: practiceSessions.id,
                user_id: practiceSessions.user_id,
                session_type: practiceSessions.session_type,
                paper_id: practiceSessions.paper_id,
                created_at: practiceSessions.created_at,
            })
                .from(practiceSessions)
                .orderBy(desc(practiceSessions.created_at))
                .limit(5),

            // 10. Average AI cost per user (total cost / distinct users with cost)
            db.select({
                avgCost: sql<number>`CASE WHEN count(DISTINCT user_id) > 0 THEN COALESCE(sum(cost_cents), 0) / count(DISTINCT user_id) ELSE 0 END`,
                usersWithCost: sql<number>`count(DISTINCT user_id)`,
            })
                .from(adminAiCostLog)
                .where(sql`${adminAiCostLog.user_id} IS NOT NULL`)
                .then(r => ({
                    avgCostCents: Number(r[0]?.avgCost || 0),
                    usersWithCost: Number(r[0]?.usersWithCost || 0),
                })),
        ]);

        // Resolve user emails for top spending users
        let enrichedTopSpenders: { userId: string | null; email: string; totalCostCents: number; callCount: number }[] = [];
        if (topSpendingUsers.length > 0) {
            const userIds = topSpendingUsers
                .map(u => u.userId)
                .filter((id): id is string => id !== null);

            if (userIds.length > 0) {
                const userEmails = await db.select({ id: users.id, email: users.email })
                    .from(users)
                    .where(sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);

                const emailMap = new Map(userEmails.map(u => [u.id, u.email]));

                enrichedTopSpenders = topSpendingUsers.map(u => ({
                    userId: u.userId,
                    email: u.userId ? emailMap.get(u.userId) || 'Unknown' : 'System',
                    totalCostCents: Number(u.totalCost),
                    callCount: Number(u.callCount),
                }));
            }
        }

        res.json(successResponse({
            metrics: {
                totalUsers,
                newUsersToday,
                dailyActiveUsers,
                newLoginsToday,
                totalSessions,
                totalRevenueCents: 0, // No payments table yet — will be 0 until Stripe integration
                aiCostTodayCents: costToday,
                aiCostTotalCents: costTotal,
                avgCostPerUserCents: avgCostPerUserData.avgCostCents,
                usersWithAiCost: avgCostPerUserData.usersWithCost,
            },
            topSpendingUsers: enrichedTopSpenders,
            recentActivity: recentSessions.map(session => ({
                type: 'session_started',
                userId: session.user_id,
                details: `Started ${session.paper_id ? 'exam' : 'practice'} session`,
                time: session.created_at,
            })),
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
        // Fetch last 30 days of metrics from the daily snapshot table
        const history = await db.query.adminPlatformMetricsDaily.findMany({
            orderBy: [desc(adminPlatformMetricsDaily.date)],
            limit: 30
        });

        // If no snapshot data exists, compute live data from existing tables
        if (history.length === 0) {
            logger.info('No daily metrics snapshot data found, computing live summary');

            // Compute a simple summary from real data
            const [totalUsers, totalSessions, totalCost] = await Promise.all([
                db.select({ count: sql<number>`count(*)` }).from(users).then(r => Number(r[0].count)),
                db.select({ count: sql<number>`count(*)` }).from(practiceSessions).then(r => Number(r[0].count)),
                db.select({ total: sql<number>`COALESCE(sum(cost_cents), 0)` }).from(adminAiCostLog).then(r => Number(r[0].total)),
            ]);

            // Return a single point representing "today"
            const today = new Date().toISOString().split('T')[0];
            res.json(successResponse({
                history: [{
                    date: today,
                    total_users: totalUsers,
                    new_users_today: 0,
                    active_users_today: 0,
                    total_sessions: totalSessions,
                    sessions_today: 0,
                    ai_cost_cumulative_cents: totalCost,
                    ai_cost_today_cents: 0,
                }]
            }));
            return;
        }

        res.json(successResponse({
            history: history.reverse() // Oldest to newest for charts
        }));
    } catch (error) {
        next(error);
    }
}
