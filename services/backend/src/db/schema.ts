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
    accuracyPercentage: integer('accuracy_percentage').default(0),
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
// Content & Exam Tables
// =============================================================================

export const articles = pgTable('articles', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title'),
    url: text('url').notNull().unique(),
    sourceName: text('source_name'),
    author: text('author'),
    publishedAt: timestamp('published_at', { mode: 'date' }), // date type in SQL
    genre: text('genre').notNull(),
    topicTags: text('topic_tags').array(), // text[]
    usedInDaily: boolean('used_in_daily').default(false),
    usedInCustomExam: boolean('used_in_custom_exam').default(false),
    dailyUsageCount: integer('daily_usage_count').default(0),
    customExamUsageCount: integer('custom_exam_usage_count').default(0),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    semanticHash: text('semantic_hash'),
    extractionModel: text('extraction_model'),
    extractionVersion: text('extraction_version'),
    isSafeSource: boolean('is_safe_source').default(true),
    isArchived: boolean('is_archived').default(false),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    semanticIdeasAndPersona: text('semantic_ideas_and_persona'), // jsonb
});

export const coreMetrics = pgTable('core_metrics', {
    key: text('key').primaryKey(),
    description: text('description').notNull(),
    version: text('version').default('v1.0').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    mappingLogic: text('mapping_logic').notNull(),
});

export const genres = pgTable('genres', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    description: text('description'),
    dailyUsageCount: integer('daily_usage_count').default(0),
    customExamUsageCount: integer('custom_exam_usage_count').default(0),
    // total_usage_count is generated column, omitted for now in drizzle definition if not needed for insert
    lastUsedDailyAt: timestamp('last_used_daily_at', { withTimezone: true }),
    lastUsedCustomExamAt: timestamp('last_used_custom_exam_at', { withTimezone: true }),
    cooldownDays: integer('cooldown_days').default(2),
    avgDifficultyScore: text('avg_difficulty_score'), // numeric
    preferredQuestionTypes: text('preferred_question_types').array(),
    isActive: boolean('is_active').default(true),
    isHighPriority: boolean('is_high_priority').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const examPapers = pgTable('exam_papers', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    year: integer('year'),
    examType: text('exam_type').default('CAT'),
    slot: text('slot'),
    isOfficial: boolean('is_official').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    usedArticlesId: uuid('used_articles_id').array(),
    generatedByUserId: uuid('generated_by_user_id').references(() => users.id, { onDelete: 'cascade' }),
    timeLimitMinutes: integer('time_limit_minutes'),
    generationStatus: text('generation_status').default('completed'),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export const passages = pgTable('passages', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 200 }),
    content: text('content').notNull(),
    wordCount: integer('word_count').notNull(),
    genre: varchar('genre', { length: 50 }).notNull(),
    difficulty: varchar('difficulty', { length: 20 }).notNull(),
    source: varchar('source', { length: 100 }),
    generationModel: varchar('generation_model', { length: 50 }),
    generationPromptVersion: varchar('generation_prompt_version', { length: 20 }),
    generationCostCents: integer('generation_cost_cents'),
    qualityScore: text('quality_score'), // numeric
    timesUsed: integer('times_used').default(0),
    avgCompletionTimeSeconds: integer('avg_completion_time_seconds'),
    avgAccuracy: text('avg_accuracy'), // numeric
    isDailyPick: boolean('is_daily_pick').default(false),
    isFeatured: boolean('is_featured').default(false),
    isArchived: boolean('is_archived').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    paperId: uuid('paper_id').references(() => examPapers.id, { onDelete: 'cascade' }),
    articleId: uuid('article_id').references(() => articles.id),
});

export const practiceSessions = pgTable('practice_sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
    sessionType: varchar('session_type', { length: 30 }).notNull(),
    mode: varchar('mode', { length: 20 }),
    passageIds: uuid('passage_ids').array(),
    questionIds: uuid('question_ids').array(),
    targetDifficulty: varchar('target_difficulty', { length: 20 }),
    targetGenres: text('target_genres').array(),
    targetQuestionTypes: text('target_question_types').array(),
    timeLimitSeconds: integer('time_limit_seconds'),
    timeSpentSeconds: integer('time_spent_seconds').default(0),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    pausedAt: timestamp('paused_at', { withTimezone: true }),
    pauseDurationSeconds: integer('pause_duration_seconds').default(0),
    totalQuestions: integer('total_questions').default(0),
    correctAnswers: integer('correct_answers').default(0),
    scorePercentage: text('score_percentage'), // numeric
    pointsEarned: integer('points_earned').default(0),
    status: varchar('status', { length: 20 }).default('in_progress'),
    currentQuestionIndex: integer('current_question_index').default(0),
    sessionData: text('session_data'), // jsonb
    isGroupSession: boolean('is_group_session').default(false),
    groupId: uuid('group_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    paperId: uuid('paper_id').references(() => examPapers.id, { onDelete: 'cascade' }),
    isAnalysed: boolean('is_analysed').default(false),
    analytics: text('analytics'), // jsonb
});

export const questionTypes = pgTable('question_types', {
    key: text('key').primaryKey(), // Using key as PK based on schema.sql
    description: text('description').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const questions = pgTable('questions', {
    id: uuid('id').primaryKey().defaultRandom(),
    passageId: uuid('passage_id').references(() => passages.id, { onDelete: 'cascade' }),
    questionText: text('question_text').notNull(),
    questionType: varchar('question_type', { length: 30 }).notNull(),
    options: text('options'), // jsonb
    correctAnswer: text('correct_answer').notNull(), // jsonb
    jumbledSentences: text('jumbled_sentences'), // jsonb
    rationale: text('rationale').notNull(),
    rationaleModel: varchar('rationale_model', { length: 50 }),
    hints: text('hints'), // jsonb
    difficulty: varchar('difficulty', { length: 20 }),
    tags: text('tags').array(), // text[]
    qualityScore: text('quality_score'), // numeric
    timesAnswered: integer('times_answered').default(0),
    timesCorrect: integer('times_correct').default(0),
    avgTimeSeconds: integer('avg_time_seconds'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    paperId: uuid('paper_id').references(() => examPapers.id, { onDelete: 'cascade' }),
});

export const questionAttempts = pgTable('question_attempts', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').notNull().references(() => practiceSessions.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
    passageId: uuid('passage_id').references(() => passages.id, { onDelete: 'cascade' }),
    userAnswer: text('user_answer'), // jsonb
    isCorrect: boolean('is_correct').notNull(),
    timeSpentSeconds: integer('time_spent_seconds').notNull(),
    confidenceLevel: integer('confidence_level'),
    markedForReview: boolean('marked_for_review').default(false),
    eliminatedOptions: text('eliminated_options').array(), // text[]
    hintUsed: boolean('hint_used').default(false),
    hintsViewed: integer('hints_viewed').default(0),
    rationaleViewed: boolean('rationale_viewed').default(false),
    rationaleHelpful: boolean('rationale_helpful'),
    userNotes: text('user_notes'),
    aiGradingScore: text('ai_grading_score'), // numeric
    aiFeedback: text('ai_feedback'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
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

// Added relations for new tables
export const practiceSessionsRelations = relations(practiceSessions, ({ one, many }) => ({
    user: one(userProfiles, {
        fields: [practiceSessions.userId],
        references: [userProfiles.id],
    }),
    attempts: many(questionAttempts),
    paper: one(examPapers, {
        fields: [practiceSessions.paperId],
        references: [examPapers.id],
    }),
}));

export const questionAttemptsRelations = relations(questionAttempts, ({ one }) => ({
    session: one(practiceSessions, {
        fields: [questionAttempts.sessionId],
        references: [practiceSessions.id],
    }),
    question: one(questions, {
        fields: [questionAttempts.questionId],
        references: [questions.id],
    }),
    user: one(userProfiles, {
        fields: [questionAttempts.userId],
        references: [userProfiles.id],
    }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
    passage: one(passages, {
        fields: [questions.passageId],
        references: [passages.id],
    }),
    attempts: many(questionAttempts),
}));

export const passagesRelations = relations(passages, ({ one, many }) => ({
    questions: many(questions),
    article: one(articles, {
        fields: [passages.articleId],
        references: [articles.id],
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
export type Article = typeof articles.$inferSelect;
export type Genre = typeof genres.$inferSelect;
export type Passage = typeof passages.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type QuestionAttempt = typeof questionAttempts.$inferSelect;
export type PracticeSession = typeof practiceSessions.$inferSelect;
export type NewPracticeSession = typeof practiceSessions.$inferInsert;

// Legacy alias for backwards compatibility
export const authUsers = users;
export type AuthUser = User;
export type NewAuthUser = NewUser;
