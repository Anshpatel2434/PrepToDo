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
import { TimeService } from '../../../common/utils/time';

const logger = createChildLogger('daily-metrics-service');

export class DailyMetricsService {
    /**
     * Aggregates metrics for a specific date (defaults to today) and updates the DB.
     * This is idempotent and can be run multiple times a day to refresh "today's" stats.
     */
    static async refreshMetrics(dateObj: Date = TimeService.getISTNow()): Promise<void> {
        const dateStr = TimeService.getISTDateString(dateObj);

        // Calculate start of day in IST for the given date
        // If dateObj is today, use startOfTodayIST
        // If dateObj is arbitrary, we parse the dateStr in IST context

        // For simplicity, we construct the range using the date string which is YYYY-MM-DD
        // in IST. We need to create a Date object that represents 00:00 IST on that day.

        // Since we don't have a parse method in TimeService yet, we can simple use the fact 
        // that our TimeService.startOfTodayIST() returns a Date object.

        // Let's rely on string comparison for the "date" field (stored as date type)
        // usage, but for querying timestamps (created_at), we need Date objects.

        // Heuristic: dateStr is YYYY-MM-DD (IST).
        // To get start of that day in UTC (for DB query), we need to subtract 5.5 hours from
        // YYYY-MM-DD T00:00:00 UTC? No.

        // Let's use date-fns-tz if possible, or simple offset math if we are confident.
        // Actually, TimeService.startOfTodayIST() returns a Date object which is the instant of midnight IST.
        // So validation:

        let startOfDay: Date;
        if (dateStr === TimeService.getISTDateString()) {
            startOfDay = TimeService.startOfTodayIST();
        } else {
            // Construct midnight IST for an arbitrary date
            // IST is UTC+5:30.
            // So 00:00 IST is 18:30 UTC previous day.
            const target = new Date(dateStr + 'T00:00:00+05:30');
            startOfDay = target;
        }

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
