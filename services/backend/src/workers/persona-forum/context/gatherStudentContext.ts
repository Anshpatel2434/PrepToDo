// =============================================================================
// Persona Forum — Gather Student Context (Anonymous)
// =============================================================================
//
// Fetches real platform data for the tutor's embodied context.
// ALL data is aggregate or anonymous — NEVER returns student names.
//
// Data sources:
//   1. admin_platform_metrics_daily — pre-computed daily aggregates (primary)
//   2. question_attempts — real-time fallback for today's data
//   3. practice_sessions — top scores, completed sessions
//   4. user_analytics — streaks (current_streak, longest_streak)
//   5. user_metric_proficiency — weakest dimension (proficiency_score)
// =============================================================================

import { db } from '../../../db/index.js';
import {
    questionAttempts,
    practiceSessions,
    userAnalytics,
    userMetricProficiency,
    adminPlatformMetricsDaily,
} from '../../../db/tables.js';
import { sql, gte, count, max, desc, eq, asc } from 'drizzle-orm';
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
        // ─── Source 1: admin_platform_metrics_daily (pre-computed) ───
        // This is the richest single source — computed daily by the analytics worker.
        let platformTotalUsers = 0;
        let platformActiveUsersToday = 0;
        let platformQuestionsToday = 0;
        let platformAvgAccuracy: number | null = null;
        let platformSessionsToday = 0;

        try {
            const latestMetrics = await db
                .select({
                    total_users: adminPlatformMetricsDaily.total_users,
                    active_users_today: adminPlatformMetricsDaily.active_users_today,
                    questions_attempted_today: adminPlatformMetricsDaily.questions_attempted_today,
                    avg_accuracy_percentage: adminPlatformMetricsDaily.avg_accuracy_percentage,
                    sessions_today: adminPlatformMetricsDaily.sessions_today,
                })
                .from(adminPlatformMetricsDaily)
                .orderBy(desc(adminPlatformMetricsDaily.date))
                .limit(1);

            if (latestMetrics.length > 0) {
                const m = latestMetrics[0];
                platformTotalUsers = m.total_users ?? 0;
                platformActiveUsersToday = m.active_users_today ?? 0;
                platformQuestionsToday = m.questions_attempted_today ?? 0;
                platformAvgAccuracy = m.avg_accuracy_percentage ? parseFloat(String(m.avg_accuracy_percentage)) : null;
                platformSessionsToday = m.sessions_today ?? 0;
            }
        } catch {
            logger.debug('admin_platform_metrics_daily not available — using real-time fallback');
        }

        // ─── Source 2: Real-time fallback (question_attempts) ───
        // If admin table didn't have today's data, compute from raw table.
        let totalAttemptsToday = platformQuestionsToday;
        let totalActiveUsers = platformActiveUsersToday;

        if (totalAttemptsToday === 0) {
            const attemptsResult = await db
                .select({ count: count() })
                .from(questionAttempts)
                .where(gte(questionAttempts.created_at, today));
            totalAttemptsToday = attemptsResult[0]?.count ?? 0;
        }

        if (totalActiveUsers === 0) {
            const activeResult = await db.execute(sql`
                SELECT COUNT(DISTINCT user_id) as active_users
                FROM question_attempts
                WHERE created_at >= ${today}
            `) as { rows: Array<{ active_users: number }> };
            totalActiveUsers = parseInt(String((activeResult.rows?.[0] as any)?.active_users ?? '0'));
        }

        // ─── Source 3: practice_sessions — top score today ───
        const topScoreResult = await db
            .select({ maxScore: max(practiceSessions.score_percentage) })
            .from(practiceSessions)
            .where(gte(practiceSessions.completed_at, today));
        const topScoreToday = topScoreResult[0]?.maxScore
            ? parseFloat(String(topScoreResult[0].maxScore))
            : null;

        // Completed sessions today
        const sessionsResult = await db
            .select({ count: count() })
            .from(practiceSessions)
            .where(gte(practiceSessions.completed_at, today));
        const completedSessionsToday = platformSessionsToday || sessionsResult[0]?.count || 0;

        // ─── Source 4: Average accuracy ───
        let averageAccuracy = platformAvgAccuracy;
        if (averageAccuracy === null && totalAttemptsToday > 0) {
            const accuracyResult = await db.execute(sql`
                SELECT
                    COUNT(*) FILTER (WHERE is_correct = true)::float /
                    NULLIF(COUNT(*)::float, 0) * 100 AS avg_accuracy
                FROM question_attempts
                WHERE created_at >= ${today}
            `) as { rows: Array<{ avg_accuracy: number | null }> };
            averageAccuracy = (accuracyResult.rows?.[0] as any)?.avg_accuracy ?? null;
        }

        // ─── Source 5: user_analytics — streaks ───
        let longestStreak: number | null = null;
        try {
            const streakResult = await db
                .select({ maxStreak: max(userAnalytics.longest_streak) })
                .from(userAnalytics);
            longestStreak = streakResult[0]?.maxStreak ?? null;
        } catch {
            logger.debug('user_analytics table not available for streaks');
        }

        // ─── Source 6: user_metric_proficiency — weakest area ───
        let mostFailedMetric: string | null = null;
        let weakestQuestionType: string | null = null;
        try {
            // Weakest core metric
            const metricResult = await db
                .select({
                    dimension_key: userMetricProficiency.dimension_key,
                    proficiency_score: userMetricProficiency.proficiency_score,
                })
                .from(userMetricProficiency)
                .where(eq(userMetricProficiency.dimension_type, 'core_metric'))
                .orderBy(asc(userMetricProficiency.proficiency_score))
                .limit(1);
            mostFailedMetric = metricResult[0]?.dimension_key ?? null;

            // Weakest question type
            const qtResult = await db
                .select({
                    dimension_key: userMetricProficiency.dimension_key,
                })
                .from(userMetricProficiency)
                .where(eq(userMetricProficiency.dimension_type, 'question_type'))
                .orderBy(asc(userMetricProficiency.proficiency_score))
                .limit(1);
            weakestQuestionType = qtResult[0]?.dimension_key ?? null;
        } catch {
            logger.debug('user_metric_proficiency table not available');
        }

        // ─── Source 7: Trap hit rate (wrong answers today) ───
        let trapHitRate: number | null = null;
        if (totalAttemptsToday > 0) {
            const trapResult = await db.execute(sql`
                SELECT
                    COUNT(*) FILTER (WHERE is_correct = false)::float /
                    NULLIF(COUNT(*)::float, 0) * 100 AS trap_rate
                FROM question_attempts
                WHERE created_at >= ${today}
            `) as { rows: Array<{ trap_rate: number | null }> };
            trapHitRate = (trapResult.rows?.[0] as any)?.trap_rate ?? null;
        }

        const context: StudentContext = {
            totalAttemptsToday,
            topScoreToday,
            averageAccuracy,
            longestStreak,
            mostFailedMetric,
            weakestQuestionType,
            trapHitRate,
            totalActiveUsers,
            totalUsers: platformTotalUsers,
            completedSessionsToday,
        };

        logger.info(`📊 [Context] Gathered: ${totalAttemptsToday} attempts, ${totalActiveUsers} active users, ${platformTotalUsers} total users, streak=${longestStreak}, weakest=${mostFailedMetric}`);
        return context;

    } catch (error) {
        logger.error({ error }, '❌ Failed to gather student context — using defaults');
        return {
            totalAttemptsToday: 0,
            topScoreToday: null,
            averageAccuracy: null,
            longestStreak: null,
            mostFailedMetric: null,
            weakestQuestionType: null,
            trapHitRate: null,
            totalActiveUsers: 0,
            totalUsers: 0,
            completedSessionsToday: 0,
        };
    }
}
