// =============================================================================
// Admin Feature - Dashboard Controller
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../../db/index.js';
import { adminPlatformMetricsDaily, adminAiCostLog, users, practiceSessions, authSessions, adminUserActivityLog } from '../../../db/schema.js';
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
            recentActivityLogs,
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
            db.select({ totalCost: sql<number>`COALESCE(sum(cost_usd), 0)` })
                .from(adminAiCostLog)
                .where(gte(adminAiCostLog.created_at, todayStart))
                .then(res => Number(res[0]?.totalCost || 0)),

            // 6. AI Cost Total (Lifetime)
            db.select({ totalCost: sql<number>`COALESCE(sum(cost_usd), 0)` })
                .from(adminAiCostLog)
                .then(res => Number(res[0]?.totalCost || 0)),

            // 7. Top Spending Users (top 10 by AI cost)
            db.select({
                userId: adminAiCostLog.user_id,
                totalCost: sql<number>`COALESCE(sum(cost_usd), 0)`,
                callCount: sql<number>`count(*)`,
            })
                .from(adminAiCostLog)
                .where(sql`${adminAiCostLog.user_id} IS NOT NULL`)
                .groupBy(adminAiCostLog.user_id)
                .orderBy(desc(sql`sum(cost_usd)`))
                .limit(10),

            // 8. New Logins Today (from auth_sessions table)
            db.select({ count: sql<number>`count(*)` }).from(authSessions)
                .where(gte(authSessions.created_at, todayStart))
                .then(res => Number(res[0].count)),

            // 9. Recent Activity - Priority: Admin Activity Log -> Fallback: Practice Sessions
            db.query.adminUserActivityLog.findMany({
                limit: 5,
                orderBy: [desc(adminUserActivityLog.created_at)],
                with: {
                    user: {
                        columns: { email: true }
                    }
                }
            }),



            // 10. (Fallback) Recent Sessions
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

            // 11. Average AI cost per user (total cost / distinct users with cost)
            db.select({
                avgCost: sql<number>`CASE WHEN count(DISTINCT user_id) > 0 THEN COALESCE(sum(cost_usd), 0) / count(DISTINCT user_id) ELSE 0 END`,
                usersWithCost: sql<number>`count(DISTINCT user_id)`,
            })
                .from(adminAiCostLog)
                .where(sql`${adminAiCostLog.user_id} IS NOT NULL`)
                .then(r => ({
                    avgCostUsd: Number(r[0]?.avgCost || 0),
                    usersWithCost: Number(r[0]?.usersWithCost || 0),
                })),
        ]);

        // Resolve user emails for top spending users
        let enrichedTopSpenders: { userId: string | null; email: string; totalCostUsd: number; callCount: number }[] = [];
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
                    totalCostUsd: Number(u.totalCost),
                    callCount: Number(u.callCount),
                }));
            }
        }

        // Construct Recent Activity List
        let recentActivityList = [];

        // If we have activities in the log, use them
        if (recentActivityLogs.length > 0) {
            recentActivityList = recentActivityLogs.map(log => ({
                type: log.event_type as string,
                userId: log.user_id,
                userEmail: log.user?.email || 'Unknown',
                details: formatActivityDetails(log.event_type, log.metadata),
                time: log.created_at,
            }));
        } else {
            // Fallback to sessions
            recentActivityList = recentSessions.map(session => ({
                type: 'session_started',
                userId: session.user_id,
                details: `Started ${session.paper_id ? 'exam' : 'practice'} session`,
                time: session.created_at,
            }));
        }

        res.json(successResponse({
            metrics: {
                totalUsers,
                newUsersToday,
                dailyActiveUsers,
                newLoginsToday,
                totalSessions,
                totalRevenueUsd: 0, // No payments table yet — will be 0 until Stripe integration
                aiCostTodayUsd: costToday,
                aiCostTotalUsd: costTotal,
                avgCostPerUserUsd: avgCostPerUserData.avgCostUsd,
                usersWithAiCost: avgCostPerUserData.usersWithCost,
            },
            topSpendingUsers: enrichedTopSpenders,
            recentActivity: recentActivityList
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

        // Use live metrics for TODAY to ensure freshness
        const today = new Date().toISOString().split('T')[0];
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Filter out any stale snapshot for today from the DB history
        const historicalData = history.filter(h => h.date !== today);

        const [
            totalUsers,
            newUsers,
            activeUsers,
            totalSessions,
            sessionsToday,
            totalCost,
            costToday
        ] = await Promise.all([
            // Total Users
            db.select({ count: sql<number>`count(*)` }).from(users).then(r => Number(r[0].count)),
            // New Users Today
            db.select({ count: sql<number>`count(*)` })
                .from(users)
                .where(gte(users.created_at, todayStart))
                .then(r => Number(r[0].count)),
            // Active Users Today (from authSessions created today)
            db.select({ count: sql<number>`count(distinct ${authSessions.user_id})` })
                .from(authSessions)
                .where(gte(authSessions.created_at, todayStart))
                .then(r => Number(r[0].count)),
            // Total Sessions
            db.select({ count: sql<number>`count(*)` }).from(practiceSessions).then(r => Number(r[0].count)),
            // Sessions Today
            db.select({ count: sql<number>`count(*)` })
                .from(practiceSessions)
                .where(gte(practiceSessions.started_at, todayStart))
                .then(r => Number(r[0].count)),
            // Cumulative AI Cost
            db.select({ total: sql<number>`COALESCE(sum(cost_usd), 0)` }).from(adminAiCostLog).then(r => Number(r[0].total)),
            // AI Cost Today
            db.select({ total: sql<number>`COALESCE(sum(cost_usd), 0)` })
                .from(adminAiCostLog)
                .where(gte(adminAiCostLog.created_at, todayStart))
                .then(r => Number(r[0].total)),
        ]);

        // Add today's live data
        historicalData.unshift({
            // @ts-ignore
            date: today,
            total_users: totalUsers,
            new_users_today: newUsers,
            active_users_today: activeUsers,
            total_sessions: totalSessions,
            sessions_today: sessionsToday,
            ai_cost_cumulative_usd: String(totalCost), // Maintain schema type consistency (decimal string)
            ai_cost_today_usd: String(costToday),
        } as any);

        // If very little history exists (e.g. only today), reconstruct from logs
        if (history.length < 5) {
            logger.info('Sparse daily metrics found, supplementing with computed history');

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // 1. Get daily costs
            const dailyCosts = await db.select({
                date: sql<string>`to_char(${adminAiCostLog.created_at}, 'YYYY-MM-DD')`,
                cost: sql<number>`COALESCE(sum(${adminAiCostLog.cost_usd}), 0)`,
            })
                .from(adminAiCostLog)
                .where(gte(adminAiCostLog.created_at, thirtyDaysAgo))
                .groupBy(sql`to_char(${adminAiCostLog.created_at}, 'YYYY-MM-DD')`);

            // 2. Get daily sessions
            const dailySessions = await db.select({
                date: sql<string>`to_char(${practiceSessions.started_at}, 'YYYY-MM-DD')`,
                count: sql<number>`count(*)`,
            })
                .from(practiceSessions)
                .where(gte(practiceSessions.started_at, thirtyDaysAgo))
                .groupBy(sql`to_char(${practiceSessions.started_at}, 'YYYY-MM-DD')`);

            // 3. Get daily new users
            const dailyNewUsers = await db.select({
                date: sql<string>`to_char(${users.created_at}, 'YYYY-MM-DD')`,
                count: sql<number>`count(*)`,
            })
                .from(users)
                .where(gte(users.created_at, thirtyDaysAgo))
                .groupBy(sql`to_char(${users.created_at}, 'YYYY-MM-DD')`);

            // 4. Get daily active users (from authSessions) - CRITICAL FIX
            const dailyActiveUsers = await db.select({
                date: sql<string>`to_char(${authSessions.created_at}, 'YYYY-MM-DD')`,
                count: sql<number>`count(distinct ${authSessions.user_id})`,
            })
                .from(authSessions)
                .where(gte(authSessions.created_at, thirtyDaysAgo))
                .groupBy(sql`to_char(${authSessions.created_at}, 'YYYY-MM-DD')`);


            // Merge data by date
            const dataMap = new Map<string, any>();
            const addToMap = (date: string, data: any) => {
                const existing = dataMap.get(date) || {
                    date,
                    ai_cost_today: 0,
                    sessions_today: 0,
                    new_users_today: 0,
                    active_users_today: 0
                };
                dataMap.set(date, { ...existing, ...data });
            };

            dailyCosts.forEach(r => addToMap(r.date, { ai_cost_today: Number(r.cost) }));
            dailySessions.forEach(r => addToMap(r.date, { sessions_today: Number(r.count) }));
            dailyNewUsers.forEach(r => addToMap(r.date, { new_users_today: Number(r.count) }));
            dailyActiveUsers.forEach(r => addToMap(r.date, { active_users_today: Number(r.count) }));

            // Iterate 30 days back and fill gaps
            // We use the 'today' stats we already fetched as the specific values for today
            // and reconstruct previous days by subtracting
            const reconstructed: any[] = [];
            let currentTotalUsers = totalUsers;
            let currentTotalSessions = totalSessions;
            let currentTotalCost = totalCost;

            for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];

                // If we have a DB snapshot for this date (and it's not today), use it
                const dbSnapshot = historicalData.find(h => h.date === dateStr);
                if (dbSnapshot) {
                    reconstructed.push(dbSnapshot);
                    // Update running totals to match snapshot if needed, but snapshots are reliable
                    currentTotalUsers = Number(dbSnapshot.total_users) - Number(dbSnapshot.new_users_today);
                    currentTotalSessions = Number(dbSnapshot.total_sessions) - Number(dbSnapshot.sessions_today);
                    currentTotalCost = Number(dbSnapshot.ai_cost_cumulative_usd || 0) - Number(dbSnapshot.ai_cost_today_usd || 0);
                    continue;
                }

                // Otherwise use computed data
                const dayData = dataMap.get(dateStr) || { ai_cost_today: 0, sessions_today: 0, new_users_today: 0, active_users_today: 0 };

                // For 'today', we already pushed it to historicalData, but let's just loop cleanly
                if (i === 0) {
                    // Start of loop (today), push today's values
                    reconstructed.push(historicalData[0]);
                } else {
                    // Past days
                    reconstructed.push({
                        date: dateStr,
                        total_users: currentTotalUsers,
                        new_users_today: dayData.new_users_today,
                        active_users_today: dayData.active_users_today,
                        total_sessions: currentTotalSessions,
                        sessions_today: dayData.sessions_today,
                        ai_cost_cumulative_usd: String(currentTotalCost),
                        ai_cost_today_usd: String(dayData.ai_cost_today)
                    });
                }

                // Updates trackers for the *next* iteration (yesterday)
                // We subtract today's gains to get yesterday's total
                if (i > 0 || !dbSnapshot) {
                    currentTotalUsers -= dayData.new_users_today;
                    currentTotalSessions -= dayData.sessions_today;
                    currentTotalCost -= dayData.ai_cost_today;
                }
            }

            // Limit to 30 and reverse
            res.json(successResponse({
                history: reconstructed.slice(0, 30).reverse()
            }));
            return;
        }

        // Standard path: DB history is sufficient
        const recentHistory = historicalData.slice(0, 30);

        res.json(successResponse({
            history: recentHistory.reverse()
        }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Helper Functions
// =============================================================================
function formatActivityDetails(eventType: string, metadata: unknown): string {
    const meta = (metadata as any) || {};

    switch (eventType) {
        case 'login':
            return 'User logged in';
        case 'session_start':
            return `Started ${meta.session_type || 'practice'} session`;
        case 'exam_generation':
            return `Generated exam: ${meta.exam_type || 'Custom Mock'}`;
        default:
            return eventType.replace(/_/g, ' ');
    }
}
