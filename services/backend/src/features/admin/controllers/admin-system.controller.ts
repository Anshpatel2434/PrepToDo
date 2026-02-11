// =============================================================================
// Admin Feature - System Controller
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../../db/index.js';
import {
    adminUserActivityLog,
    adminPlatformMetricsDaily,
    adminAiCostLog,
    users,
    practiceSessions,
    passages,
    questions,
    examPapers,
    questionAttempts,
} from '../../../db/schema.js';
import { desc, sql, gte, eq } from 'drizzle-orm';
import { successResponse, Errors } from '../../../common/utils/errors.js';
import { createChildLogger } from '../../../common/utils/logger.js';

const logger = createChildLogger('admin-system');

// =============================================================================
// Blocked SQL Keywords (prevent write operations)
// =============================================================================
const BLOCKED_KEYWORDS = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE',
    'CREATE', 'GRANT', 'REVOKE', 'COPY', 'EXEC', 'EXECUTE',
];

// =============================================================================
// Get Activity Logs
// =============================================================================
export async function getActivityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

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

// =============================================================================
// Run Read-Only SQL Query
// =============================================================================
export async function runQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { query } = req.body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            throw Errors.badRequest('Query is required');
        }

        const normalizedQuery = query.trim().toUpperCase();

        // Block any write/destructive operations
        for (const keyword of BLOCKED_KEYWORDS) {
            // Check for the keyword as a standalone word
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(normalizedQuery)) {
                throw Errors.adminInvalidQuery(
                    `Query contains blocked keyword: ${keyword}. Only SELECT queries are allowed.`
                );
            }
        }

        // Must start with SELECT or WITH (for CTEs)
        if (!normalizedQuery.startsWith('SELECT') && !normalizedQuery.startsWith('WITH')) {
            throw Errors.adminInvalidQuery('Only SELECT queries are allowed.');
        }

        logger.info({ queryLength: query.length }, 'Admin running SQL query');

        // Execute with row limit for safety
        const limitedQuery = `SELECT * FROM (${query.replace(/;$/, '')}) AS __admin_query LIMIT 100`;

        const result = await db.execute(sql.raw(limitedQuery));

        res.json(successResponse({
            rows: result.rows || result,
            rowCount: Array.isArray(result.rows) ? result.rows.length : (Array.isArray(result) ? result.length : 0),
            fields: result.fields?.map((f: any) => f.name) || Object.keys((result.rows || result)[0] || {}),
        }));
    } catch (error: any) {
        // If it's already an ApiError, let it pass through
        if (error.name === 'ApiError') {
            return next(error);
        }
        // For SQL errors, wrap them nicely
        logger.error({ error: error.message }, 'Admin SQL query error');
        throw Errors.adminInvalidQuery(error.message || 'Query execution failed');
    }
}

// =============================================================================
// Take Daily Metrics Snapshot
// =============================================================================
export async function takeDailySnapshot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStr = todayStart.toISOString().split('T')[0];

        logger.info({ date: todayStr }, 'Taking daily metrics snapshot');

        // Compute all metrics in parallel
        const [
            totalUsers,
            newUsersToday,
            activeUsersToday,
            totalSessions,
            sessionsToday,
            totalQuestionsAttempted,
            questionsAttemptedToday,
            totalPassagesGenerated,
            passagesGeneratedToday,
            totalExamsGenerated,
            examsGeneratedToday,
            aiCostToday,
            aiCostCumulative,
        ] = await Promise.all([
            db.select({ count: sql<number>`count(*)` }).from(users).then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.created_at, todayStart)).then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.last_sign_in_at, todayStart)).then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(practiceSessions).then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(practiceSessions).where(gte(practiceSessions.created_at, todayStart)).then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(questionAttempts).then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(questionAttempts).where(gte(questionAttempts.created_at, todayStart)).then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(passages).then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(passages).where(gte(passages.created_at, todayStart)).then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(examPapers).then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(examPapers).where(gte(examPapers.created_at, todayStart)).then(r => Number(r[0].count)),
            db.select({ total: sql<number>`COALESCE(sum(cost_cents), 0)` }).from(adminAiCostLog).where(gte(adminAiCostLog.created_at, todayStart)).then(r => Number(r[0].total)),
            db.select({ total: sql<number>`COALESCE(sum(cost_cents), 0)` }).from(adminAiCostLog).then(r => Number(r[0].total)),
        ]);

        // Upsert the row for today (ON CONFLICT UPDATE)
        await db.execute(sql`
            INSERT INTO admin_platform_metrics_daily (
                id, date, total_users, new_users_today, active_users_today,
                total_sessions, sessions_today,
                total_questions_attempted, questions_attempted_today,
                total_passages_generated, passages_generated_today,
                total_exams_generated, exams_generated_today,
                ai_cost_today_cents, ai_cost_cumulative_cents,
                created_at
            ) VALUES (
                gen_random_uuid(), ${todayStr}, ${totalUsers}, ${newUsersToday}, ${activeUsersToday},
                ${totalSessions}, ${sessionsToday},
                ${totalQuestionsAttempted}, ${questionsAttemptedToday},
                ${totalPassagesGenerated}, ${passagesGeneratedToday},
                ${totalExamsGenerated}, ${examsGeneratedToday},
                ${aiCostToday}, ${aiCostCumulative},
                NOW()
            )
            ON CONFLICT (date) DO UPDATE SET
                total_users = EXCLUDED.total_users,
                new_users_today = EXCLUDED.new_users_today,
                active_users_today = EXCLUDED.active_users_today,
                total_sessions = EXCLUDED.total_sessions,
                sessions_today = EXCLUDED.sessions_today,
                total_questions_attempted = EXCLUDED.total_questions_attempted,
                questions_attempted_today = EXCLUDED.questions_attempted_today,
                total_passages_generated = EXCLUDED.total_passages_generated,
                passages_generated_today = EXCLUDED.passages_generated_today,
                total_exams_generated = EXCLUDED.total_exams_generated,
                exams_generated_today = EXCLUDED.exams_generated_today,
                ai_cost_today_cents = EXCLUDED.ai_cost_today_cents,
                ai_cost_cumulative_cents = EXCLUDED.ai_cost_cumulative_cents
        `);

        logger.info({ date: todayStr }, 'Daily metrics snapshot saved successfully');

        res.json(successResponse({
            date: todayStr,
            snapshot: {
                totalUsers,
                newUsersToday,
                activeUsersToday,
                totalSessions,
                sessionsToday,
                totalQuestionsAttempted,
                questionsAttemptedToday,
                totalPassagesGenerated,
                passagesGeneratedToday,
                totalExamsGenerated,
                examsGeneratedToday,
                aiCostTodayCents: aiCostToday,
                aiCostCumulativeCents: aiCostCumulative,
            },
        }, 'Snapshot saved successfully'));
    } catch (error) {
        next(error);
    }
}
