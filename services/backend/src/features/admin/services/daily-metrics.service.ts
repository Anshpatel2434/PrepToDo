import { sql, gte, lt, and } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import {
    users,
    practiceSessions,
    adminAiCostLog,
    adminPlatformMetricsDaily,
    authSessions
} from '../../../db/schema.js';
import { createChildLogger } from '../../../common/utils/logger.js';

const logger = createChildLogger('daily-metrics-service');

export class DailyMetricsService {
    /**
     * Aggregates metrics for a specific date (defaults to today) and updates the DB.
     * This is idempotent and can be run multiple times a day to refresh "today's" stats.
     */
    static async refreshMetrics(dateObj: Date = new Date()): Promise<void> {
        const dateStr = dateObj.toISOString().split('T')[0];
        const startOfDay = new Date(dateStr);
        startOfDay.setUTCHours(0, 0, 0, 0); // Ensure UTC consistency if needed, though schema handles timestamp with tz

        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        logger.info({ date: dateStr }, 'Refreshing daily platform metrics');

        try {
            // 1. Total Counts (Cumulative)
            const [totalUsersRes] = await db.select({ count: sql<number>`count(*)` }).from(users);
            const [totalSessionsRes] = await db.select({ count: sql<number>`count(*)` }).from(practiceSessions);
            const [totalAiCostRes] = await db.select({ total: sql<number>`COALESCE(sum(cost_usd), 0)` }).from(adminAiCostLog);

            // 2. Daily Counts (For the specific date)
            const [newUsersRes] = await db.select({ count: sql<number>`count(*)` })
                .from(users)
                .where(and(gte(users.created_at, startOfDay), lt(users.created_at, endOfDay)));

            const [sessionsTodayRes] = await db.select({ count: sql<number>`count(*)` })
                .from(practiceSessions)
                .where(and(gte(practiceSessions.started_at, startOfDay), lt(practiceSessions.started_at, endOfDay)));

            const [aiCostTodayRes] = await db.select({ total: sql<number>`COALESCE(sum(cost_usd), 0)` })
                .from(adminAiCostLog)
                .where(and(gte(adminAiCostLog.created_at, startOfDay), lt(adminAiCostLog.created_at, endOfDay)));

            // 3. Active Users (Users with a login session created today)
            const [activeUsersRes] = await db.select({ count: sql<number>`count(distinct ${authSessions.user_id})` })
                .from(authSessions)
                .where(and(gte(authSessions.created_at, startOfDay), lt(authSessions.created_at, endOfDay)));

            // 4. Upsert into admin_platform_metrics_daily
            await db.insert(adminPlatformMetricsDaily).values({
                date: dateStr,
                total_users: Number(totalUsersRes.count),
                new_users_today: Number(newUsersRes.count),
                active_users_today: Number(activeUsersRes.count),
                total_sessions: Number(totalSessionsRes.count),
                sessions_today: Number(sessionsTodayRes.count),
                ai_cost_cumulative_usd: sql`${Number(totalAiCostRes.total)}`,
                ai_cost_today_usd: sql`${Number(aiCostTodayRes.total)}`
            }).onConflictDoUpdate({
                target: adminPlatformMetricsDaily.date,
                set: {
                    total_users: Number(totalUsersRes.count),
                    new_users_today: Number(newUsersRes.count),
                    active_users_today: Number(activeUsersRes.count),
                    total_sessions: Number(totalSessionsRes.count),
                    sessions_today: Number(sessionsTodayRes.count),
                    ai_cost_cumulative_usd: sql`${Number(totalAiCostRes.total)}`,
                    ai_cost_today_usd: sql`${Number(aiCostTodayRes.total)}`,
                    // We can add logic for other fields like questions_attempted if needed
                }
            });

            logger.info({ date: dateStr }, 'Daily platform metrics refreshed successfully');

        } catch (error) {
            logger.error({ error, date: dateStr }, 'Failed to refresh daily platform metrics');
            throw error;
        }
    }
}
