// =============================================================================
// Admin Feature - Users Controller
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../../db/index.js';
import { users, practiceSessions, adminAiCostLog, questionAttempts, userAnalytics } from '../../../db/schema.js';
import { eq, desc, sql, like, or, sum } from 'drizzle-orm';
import { successResponse, Errors } from '../../../common/utils/errors.js';
import { createChildLogger } from '../../../common/utils/logger.js';

const logger = createChildLogger('admin-users');

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
                    role: true,
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
// Get Single User Details (Enriched with AI Cost & Analytics)
// =============================================================================
export async function getUserDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { id } = req.params;

        // 1. Fetch user (without practiceSessions relation — it goes through userProfiles, not users)
        const user = await db.query.users.findFirst({
            where: eq(users.id, id as string),
            with: {
                profile: {
                    columns: { display_name: true, username: true, subscription_tier: true }
                }
            }
        });

        if (!user) {
            throw Errors.notFound('User');
        }

        // Fetch sessions separately (practiceSessions.user_id → userProfiles.id, which equals users.id)
        const recentSessions = await db.select()
            .from(practiceSessions)
            .where(eq(practiceSessions.user_id, id as string))
            .orderBy(desc(practiceSessions.created_at))
            .limit(10);

        // 2. Parallel fetch: AI costs, question attempts, user analytics
        const [aiCostData, attemptStats, analytics] = await Promise.all([
            // AI cost for this user
            db.select({
                totalCostUsd: sql<number>`COALESCE(sum(cost_usd), 0)`,
                callCount: sql<number>`count(*)`,
            })
                .from(adminAiCostLog)
                .where(eq(adminAiCostLog.user_id, id as string))
                .then(r => ({
                    totalCostUsd: Number(r[0]?.totalCostUsd || 0),
                    callCount: Number(r[0]?.callCount || 0),
                })),

            // Question attempt stats for this user (user_id references userProfiles.id which is same as users.id)
            db.select({
                totalAttempted: sql<number>`count(*)`,
                totalCorrect: sql<number>`COALESCE(sum(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)`,
                totalTimeSpent: sql<number>`COALESCE(sum(time_spent_seconds), 0)`,
            })
                .from(questionAttempts)
                .where(eq(questionAttempts.user_id, id as string))
                .then(r => ({
                    totalAttempted: Number(r[0]?.totalAttempted || 0),
                    totalCorrect: Number(r[0]?.totalCorrect || 0),
                    totalTimeSpent: Number(r[0]?.totalTimeSpent || 0),
                    accuracy: Number(r[0]?.totalAttempted || 0) > 0
                        ? Math.round((Number(r[0]?.totalCorrect || 0) / Number(r[0]?.totalAttempted || 1)) * 100)
                        : 0,
                })),

            // User analytics summary
            db.select()
                .from(userAnalytics)
                .where(eq(userAnalytics.user_id, id as string))
                .then(r => r[0] || null),
        ]);

        res.json(successResponse({
            user: { ...user, practiceSessions: recentSessions },
            aiCost: aiCostData,
            questionStats: attemptStats,
            analytics: analytics ? {
                minutesPracticed: analytics.minutes_practiced,
                questionsAttempted: analytics.questions_attempted,
                questionsCorrect: analytics.questions_correct,
                accuracyPercentage: analytics.accuracy_percentage,
                currentStreak: analytics.current_streak,
                longestStreak: analytics.longest_streak,
                totalPoints: analytics.total_points,
            } : null,
        }));
    } catch (error) {
        next(error);
    }
}
