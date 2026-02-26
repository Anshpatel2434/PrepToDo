// =============================================================================
// Admin Feature - Users Controller
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../../db/index.js';
import { users, userProfiles, practiceSessions, adminAiCostLog, questionAttempts, userAnalytics } from '../../../db/schema.js';
import { eq, desc, sql, like } from 'drizzle-orm';
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

        // Parallel fetch count and data — using explicit LEFT JOIN instead of relational queries
        const [totalCountRes, rawRows] = await Promise.all([
            db.select({ count: sql<number>`count(*)` })
                .from(users)
                .where(whereClause),

            db.select({
                id: users.id,
                email: users.email,
                role: users.role,
                created_at: users.created_at,
                last_sign_in_at: users.last_sign_in_at,
                last_active: sql<string | null>`COALESCE(
                    ${users.last_sign_in_at},
                    (SELECT MAX(${practiceSessions.created_at}) FROM ${practiceSessions} WHERE ${practiceSessions.user_id} = ${users.id})
                )`,
                display_name: userProfiles.display_name,
            })
                .from(users)
                .leftJoin(userProfiles, eq(users.id, userProfiles.id))
                .where(whereClause)
                .orderBy(desc(users.created_at))
                .limit(limit)
                .offset(offset)
        ]);

        const total = Number(totalCountRes[0].count);

        // Shape response to match expected format
        const usersList = rawRows.map(row => ({
            id: row.id,
            email: row.email,
            role: row.role,
            created_at: row.created_at,
            last_sign_in_at: row.last_active || row.last_sign_in_at,
            profile: row.display_name ? { display_name: row.display_name } : null,
        }));

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

        // 1. Fetch user with profile via explicit LEFT JOIN
        const userRows = await db.select({
            id: users.id,
            email: users.email,
            role: users.role,
            created_at: users.created_at,
            last_sign_in_at: users.last_sign_in_at,
            updated_at: users.updated_at,
            ai_insights_remaining: users.ai_insights_remaining,
            customized_mocks_remaining: users.customized_mocks_remaining,
            display_name: userProfiles.display_name,
            username: userProfiles.username,
            subscription_tier: userProfiles.subscription_tier,
        })
            .from(users)
            .leftJoin(userProfiles, eq(users.id, userProfiles.id))
            .where(eq(users.id, id as string))
            .limit(1);

        if (userRows.length === 0) {
            throw Errors.notFound('User');
        }

        const row = userRows[0];
        const user = {
            id: row.id,
            email: row.email,
            role: row.role,
            created_at: row.created_at,
            last_sign_in_at: row.last_sign_in_at,
            updated_at: row.updated_at,
            ai_insights_remaining: row.ai_insights_remaining,
            customized_mocks_remaining: row.customized_mocks_remaining,
            profile: {
                display_name: row.display_name,
                username: row.username,
                subscription_tier: row.subscription_tier,
            },
        };

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

            // Question attempt stats
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

// =============================================================================
// Update User Fields
// =============================================================================
export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { id } = req.params;
        const { role, email, ai_insights_remaining, customized_mocks_remaining } = req.body;

        // Check user exists with direct select (no relational query)
        const existing = await db.select({ id: users.id })
            .from(users)
            .where(eq(users.id, id as string))
            .limit(1);

        if (existing.length === 0) {
            throw Errors.notFound('User');
        }

        // Build update object with only provided fields
        const updateData: Record<string, any> = { updated_at: new Date() };
        if (role !== undefined) updateData.role = role;
        if (email !== undefined) updateData.email = email;
        if (ai_insights_remaining !== undefined) updateData.ai_insights_remaining = ai_insights_remaining;
        if (customized_mocks_remaining !== undefined) updateData.customized_mocks_remaining = customized_mocks_remaining;

        await db.update(users).set(updateData).where(eq(users.id, id as string));

        logger.info({ userId: id, fields: Object.keys(updateData) }, 'Admin updated user fields');

        res.json(successResponse({ message: 'User updated successfully' }));
    } catch (error) {
        next(error);
    }
}
