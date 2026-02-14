import type { Request, Response, NextFunction } from 'express';
import { eq, and, ne } from 'drizzle-orm';

import { db } from '../../../db/index.js';
import { userProfiles, userAnalytics, userProficiencySignals, userMetricProficiency, users } from '../../../db/schema.js';
import { Errors, successResponse } from '../../../common/utils/errors.js';
import { createChildLogger } from '../../../common/utils/logger.js';

// Create dashboard-specific logger
const dashboardLogger = createChildLogger('dashboard');

// =============================================================================
// Response Types
// =============================================================================
interface DashboardDataResponse {
    profile: typeof userProfiles.$inferSelect | null;
    analytics: typeof userAnalytics.$inferSelect | null;
    proficiencySignals: typeof userProficiencySignals.$inferSelect | null;
    metricProficiency: (typeof userMetricProficiency.$inferSelect)[];
}

// =============================================================================
// Get Dashboard Data (Combined - Optimized for Single Request)
// =============================================================================
export async function getDashboardData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw Errors.unauthorized();
        }

        dashboardLogger.info({ userId, action: 'get_dashboard' }, 'Fetching dashboard data');

        // Fetch all data in parallel for better performance
        const [profileData, analyticsData, signalsData, metricsData, quotaData] = await Promise.all([
            db.select().from(userProfiles).where(eq(userProfiles.id, userId)).limit(1),
            db.select().from(userAnalytics).where(eq(userAnalytics.user_id, userId)).limit(1),
            db.select().from(userProficiencySignals).where(eq(userProficiencySignals.user_id, userId)).limit(1),
            db.select().from(userMetricProficiency).where(eq(userMetricProficiency.user_id, userId)),
            db.select({
                ai_insights_remaining: users.ai_insights_remaining,
                customized_mocks_remaining: users.customized_mocks_remaining
            }).from(users).where(eq(users.id, userId)).limit(1),
        ]);

        const profile = profileData[0] || null;
        if (profile && quotaData[0]) {
            // @ts-ignore - Merging extra fields not in original Schema
            profile.ai_insights_remaining = quotaData[0].ai_insights_remaining;
            // @ts-ignore - Merging extra fields not in original Schema
            profile.customized_mocks_remaining = quotaData[0].customized_mocks_remaining;
        }

        const response: DashboardDataResponse = {
            profile: profile,
            analytics: analyticsData[0] || null,
            proficiencySignals: signalsData[0] || null,
            metricProficiency: metricsData || [],
        };

        dashboardLogger.info({ userId, action: 'get_dashboard' }, 'Dashboard data fetched successfully');
        res.json(successResponse(response));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Get User Profile
// =============================================================================
export async function getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw Errors.unauthorized();
        }

        const [profile] = await db
            .select()
            .from(userProfiles)
            .where(eq(userProfiles.id, userId))
            .limit(1);

        if (!profile) {
            dashboardLogger.warn({ userId, action: 'get_profile' }, 'User profile not found');
            throw Errors.notFound('User profile not found');
        }

        res.json(successResponse({ profile }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Get User Analytics
// =============================================================================
export async function getUserAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw Errors.unauthorized();
        }

        const [analytics] = await db
            .select()
            .from(userAnalytics)
            .where(eq(userAnalytics.user_id, userId))
            .limit(1);

        // It's okay if analytics doesn't exist yet (new user)
        res.json(successResponse({ analytics: analytics || null }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Get User Proficiency Signals
// =============================================================================
export async function getUserProficiencySignals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw Errors.unauthorized();
        }

        const [signals] = await db
            .select()
            .from(userProficiencySignals)
            .where(eq(userProficiencySignals.user_id, userId))
            .limit(1);

        // It's okay if signals don't exist yet (new user)
        res.json(successResponse({ proficiencySignals: signals || null }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Get User Metric Proficiency
// =============================================================================
export async function getUserMetricProficiency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw Errors.unauthorized();
        }

        const metrics = await db
            .select()
            .from(userMetricProficiency)
            .where(eq(userMetricProficiency.user_id, userId));

        res.json(successResponse({ metricProficiency: metrics || [] }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Update User Profile
// =============================================================================
export async function updateUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw Errors.unauthorized();
        }

        const { displayName, username, preferredDifficulty, theme, dailyGoalMinutes, showOnLeaderboard } = req.body;

        // Only update fields that are provided
        const updateData: Partial<typeof userProfiles.$inferInsert> = {
            updated_at: new Date(),
        };

        // Username validation and uniqueness check
        if (username !== undefined) {
            const trimmedUsername = String(username).trim();

            // Length check
            if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
                res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_USERNAME', message: 'Username must be between 3 and 50 characters.' },
                });
                return;
            }

            // Format check: alphanumeric + underscores only
            if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
                res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_USERNAME', message: 'Username can only contain letters, numbers, and underscores.' },
                });
                return;
            }

            // Uniqueness check (exclude current user)
            const [existing] = await db
                .select({ id: userProfiles.id })
                .from(userProfiles)
                .where(and(
                    eq(userProfiles.username, trimmedUsername),
                    ne(userProfiles.id, userId)
                ))
                .limit(1);

            if (existing) {
                res.status(409).json({
                    success: false,
                    error: { code: 'USERNAME_TAKEN', message: 'This username is already taken. Please choose another.' },
                });
                return;
            }

            updateData.username = trimmedUsername;
        }

        if (displayName !== undefined) updateData.display_name = displayName;
        if (preferredDifficulty !== undefined) updateData.preferred_difficulty = preferredDifficulty;
        if (theme !== undefined) updateData.theme = theme;
        if (dailyGoalMinutes !== undefined) updateData.daily_goal_minutes = dailyGoalMinutes;
        if (showOnLeaderboard !== undefined) updateData.show_on_leaderboard = showOnLeaderboard;

        await db
            .update(userProfiles)
            .set(updateData)
            .where(eq(userProfiles.id, userId));

        const [updatedProfile] = await db
            .select()
            .from(userProfiles)
            .where(eq(userProfiles.id, userId))
            .limit(1);

        dashboardLogger.info({ userId, action: 'update_profile' }, 'User profile updated');
        res.json(successResponse({ profile: updatedProfile, message: 'Profile updated successfully' }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Check Username Availability
// =============================================================================
export async function checkUsernameAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw Errors.unauthorized();
        }

        const username = String(req.query.username || '').trim();

        if (!username || username.length < 3) {
            res.json(successResponse({ available: false }));
            return;
        }

        // Check uniqueness (exclude current user)
        const [existing] = await db
            .select({ id: userProfiles.id })
            .from(userProfiles)
            .where(and(
                eq(userProfiles.username, username),
                ne(userProfiles.id, userId)
            ))
            .limit(1);

        res.json(successResponse({ available: !existing }));
    } catch (error) {
        next(error);
    }
}
