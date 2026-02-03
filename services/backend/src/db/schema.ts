import { pgTable, uuid, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =============================================================================
// Users Table (in public schema)
// =============================================================================
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    encryptedPassword: varchar('encrypted_password', { length: 255 }),
    emailConfirmedAt: timestamp('email_confirmed_at', { withTimezone: true }),
    lastSignInAt: timestamp('last_sign_in_at', { withTimezone: true }),

    // Provider info
    provider: varchar('provider', { length: 50 }).default('email'),
    googleId: varchar('google_id', { length: 255 }),

    // Metadata
    rawAppMetaData: text('raw_app_meta_data'),
    rawUserMetaData: text('raw_user_meta_data'),
    isSsoUser: boolean('is_sso_user').default(false),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// Auth Sessions Table
// =============================================================================
export const authSessions = pgTable('auth_sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).notNull(),
    userAgent: text('user_agent'),
    ip: varchar('ip', { length: 45 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// Pending Signups Table (for OTP verification flow)
// =============================================================================
export const authPendingSignups = pgTable('auth_pending_signups', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    otpHash: varchar('otp_hash', { length: 255 }).notNull(),
    attempts: varchar('attempts', { length: 10 }).default('0'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// Password Reset Tokens Table
// =============================================================================
export const authPasswordResetTokens = pgTable('auth_password_reset_tokens', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// User Profiles Table
// =============================================================================
export const userProfiles = pgTable('user_profiles', {
    id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    username: varchar('username', { length: 50 }).notNull().unique(),
    displayName: varchar('display_name', { length: 100 }),
    avatarUrl: text('avatar_url'),
    subscriptionTier: varchar('subscription_tier', { length: 20 }).default('free'),
    subscriptionExpiresAt: timestamp('subscription_expires_at', { withTimezone: true }),
    dailyGoalMinutes: integer('daily_goal_minutes').default(30),
    preferredDifficulty: varchar('preferred_difficulty', { length: 20 }).default('medium'),
    theme: varchar('theme', { length: 20 }).default('light'),
    dataConsentGiven: boolean('data_consent_given').default(false),
    showOnLeaderboard: boolean('show_on_leaderboard').default(true),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow(),
    email: text('email').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// User Analytics Table
// =============================================================================
export const userAnalytics = pgTable('user_analytics', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().unique().references(() => userProfiles.id, { onDelete: 'cascade' }),
    minutesPracticed: integer('minutes_practiced').default(0),
    questionsAttempted: integer('questions_attempted').default(0),
    questionsCorrect: integer('questions_correct').default(0),
    accuracyPercentage: varchar('accuracy_percentage', { length: 10 }),
    isActiveDay: boolean('is_active_day').default(false),
    currentStreak: integer('current_streak').default(0),
    longestStreak: integer('longest_streak').default(0),
    pointsEarnedToday: integer('points_earned_today').default(0),
    totalPoints: integer('total_points').default(0),
    genrePerformance: text('genre_performance'), // JSONB stored as text
    difficultyPerformance: text('difficulty_performance'),
    questionTypePerformance: text('question_type_performance'),
    newWordsLearned: integer('new_words_learned').default(0),
    wordsReviewed: integer('words_reviewed').default(0),
    lastActiveDate: varchar('last_active_date', { length: 20 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// User Proficiency Signals Table
// =============================================================================
export const userProficiencySignals = pgTable('user_proficiency_signals', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().unique().references(() => userProfiles.id, { onDelete: 'cascade' }),
    overallPercentile: integer('overall_percentile'),
    estimatedCatPercentile: integer('estimated_cat_percentile'),
    genreStrengths: text('genre_strengths'), // JSONB stored as text
    inferenceSkill: integer('inference_skill'),
    toneAnalysisSkill: integer('tone_analysis_skill'),
    mainIdeaSkill: integer('main_idea_skill'),
    detailComprehensionSkill: integer('detail_comprehension_skill'),
    recommendedDifficulty: varchar('recommended_difficulty', { length: 20 }),
    weakTopics: text('weak_topics'), // Array stored as text
    weakQuestionTypes: text('weak_question_types'),
    calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow(),
    dataPointsCount: integer('data_points_count'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// User Metric Proficiency Table
// =============================================================================
export const userMetricProficiency = pgTable('user_metric_proficiency', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
    dimensionType: text('dimension_type').notNull(),
    dimensionKey: text('dimension_key').notNull(),
    proficiencyScore: integer('proficiency_score').notNull(),
    confidenceScore: varchar('confidence_score', { length: 10 }).notNull(),
    totalAttempts: integer('total_attempts').default(0),
    correctAttempts: integer('correct_attempts').default(0),
    lastSessionId: uuid('last_session_id'),
    trend: text('trend'),
    speedVsAccuracyData: text('speed_vs_accuracy_data'), // JSONB stored as text
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// Relations
// =============================================================================
export const usersRelations = relations(users, ({ many, one }) => ({
    sessions: many(authSessions),
    passwordResetTokens: many(authPasswordResetTokens),
    profile: one(userProfiles, {
        fields: [users.id],
        references: [userProfiles.id],
    }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
    user: one(users, {
        fields: [authSessions.userId],
        references: [users.id],
    }),
}));

export const authPasswordResetTokensRelations = relations(authPasswordResetTokens, ({ one }) => ({
    user: one(users, {
        fields: [authPasswordResetTokens.userId],
        references: [users.id],
    }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
    user: one(users, {
        fields: [userProfiles.id],
        references: [users.id],
    }),
}));

// =============================================================================
// Type Exports
// =============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AuthSession = typeof authSessions.$inferSelect;
export type NewAuthSession = typeof authSessions.$inferInsert;
export type AuthPendingSignup = typeof authPendingSignups.$inferSelect;
export type NewAuthPendingSignup = typeof authPendingSignups.$inferInsert;
export type AuthPasswordResetToken = typeof authPasswordResetTokens.$inferSelect;
export type NewAuthPasswordResetToken = typeof authPasswordResetTokens.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type UserAnalytics = typeof userAnalytics.$inferSelect;
export type NewUserAnalytics = typeof userAnalytics.$inferInsert;
export type UserProficiencySignals = typeof userProficiencySignals.$inferSelect;
export type NewUserProficiencySignals = typeof userProficiencySignals.$inferInsert;
export type UserMetricProficiency = typeof userMetricProficiency.$inferSelect;
export type NewUserMetricProficiency = typeof userMetricProficiency.$inferInsert;

// Legacy alias for backwards compatibility
export const authUsers = users;
export type AuthUser = User;
export type NewAuthUser = NewUser;
