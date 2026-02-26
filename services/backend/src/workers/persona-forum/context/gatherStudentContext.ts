// =============================================================================
// Persona Forum — Gather Student Context (Anonymous)
// =============================================================================
//
// Fetches real platform data for the tutor's embodied context.
// ALL data is aggregate or anonymous — NEVER returns student names.
//
// Data collected:
//   - Total attempts today
//   - Top score today (score only, no name)
//   - Average accuracy across all users
//   - Longest active streak (count only)
//   - Most-failed metric
//   - Trap option hit rate
//   - Total active users
// =============================================================================

import { db } from '../../../db/index.js';
import { questionAttempts, practiceSessions } from '../../../db/tables.js';
import { sql, gte, count, avg, max } from 'drizzle-orm';
import { createChildLogger } from '../../../common/utils/logger.js';
import type { StudentContext } from '../prompts/buildPersonaPrompt.js';

const logger = createChildLogger('student-context');

/**
 * Returns the start of today in UTC for filtering recent data.
 */
function todayStart(): Date {
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    return now;
}

/**
 * Gathers anonymous platform-wide student data for persona context.
 * No student names are ever returned.
 */
export async function gatherStudentContext(): Promise<StudentContext> {
    const today = todayStart();

    try {
        // 1. Total attempts today
        const attemptsResult = await db
            .select({ count: count() })
            .from(questionAttempts)
            .where(gte(questionAttempts.created_at, today));
        const totalAttemptsToday = attemptsResult[0]?.count ?? 0;

        // 2. Top score today (from practice sessions completed today)
        const topScoreResult = await db
            .select({ maxScore: max(practiceSessions.score_percentage) })
            .from(practiceSessions)
            .where(gte(practiceSessions.created_at, today));
        const topScoreToday = topScoreResult[0]?.maxScore
            ? parseFloat(topScoreResult[0].maxScore)
            : null;

        // 3. Average accuracy across today's attempts
        const accuracyResult = await db.execute(sql`
            SELECT
                COUNT(*) FILTER (WHERE is_correct = true)::float /
                NULLIF(COUNT(*)::float, 0) * 100 AS avg_accuracy
            FROM question_attempts
            WHERE created_at >= ${today}
        `) as { rows: Array<{ avg_accuracy: number | null }> };
        const averageAccuracy = (accuracyResult.rows?.[0] as any)?.avg_accuracy ?? null;

        // 4. Longest active streak (from user_streaks if it exists, else null)
        let longestStreak: number | null = null;
        try {
            const streakResult = await db.execute(sql`
                SELECT MAX(current_streak) as max_streak
                FROM user_streaks
            `) as { rows: Array<{ max_streak: number | null }> };
            longestStreak = (streakResult.rows?.[0] as any)?.max_streak ?? null;
        } catch {
            // user_streaks table may not exist yet
            logger.debug('user_streaks table not available');
        }

        // 5. Most failed metric (from user_metric_proficiency)
        let mostFailedMetric: string | null = null;
        try {
            const metricResult = await db.execute(sql`
                SELECT metric_key, AVG(accuracy) as avg_acc
                FROM user_metric_proficiency
                GROUP BY metric_key
                ORDER BY avg_acc ASC
                LIMIT 1
            `) as { rows: Array<{ metric_key: string; avg_acc: number }> };
            mostFailedMetric = (metricResult.rows?.[0] as any)?.metric_key ?? null;
        } catch {
            logger.debug('user_metric_proficiency table not available');
        }

        // 6. Trap hit rate (percentage of wrong answers today)
        const trapResult = await db.execute(sql`
            SELECT
                COUNT(*) FILTER (WHERE is_correct = false)::float /
                NULLIF(COUNT(*)::float, 0) * 100 AS trap_rate
            FROM question_attempts
            WHERE created_at >= ${today}
        `) as { rows: Array<{ trap_rate: number | null }> };
        const trapHitRate = (trapResult.rows?.[0] as any)?.trap_rate ?? null;

        // 7. Total active users (distinct users who attempted today)
        const activeResult = await db.execute(sql`
            SELECT COUNT(DISTINCT user_id) as active_users
            FROM question_attempts
            WHERE created_at >= ${today}
        `) as { rows: Array<{ active_users: number }> };
        const totalActiveUsers = parseInt(String((activeResult.rows?.[0] as any)?.active_users ?? '0'));

        const context: StudentContext = {
            totalAttemptsToday,
            topScoreToday,
            averageAccuracy,
            longestStreak,
            mostFailedMetric,
            trapHitRate,
            totalActiveUsers,
        };

        logger.info(`📊 [Context] Gathered: ${totalAttemptsToday} attempts, ${totalActiveUsers} active users`);
        return context;

    } catch (error) {
        logger.error({ error }, '❌ Failed to gather student context — using defaults');
        return {
            totalAttemptsToday: 0,
            topScoreToday: null,
            averageAccuracy: null,
            longestStreak: null,
            mostFailedMetric: null,
            trapHitRate: null,
            totalActiveUsers: 0,
        };
    }
}
