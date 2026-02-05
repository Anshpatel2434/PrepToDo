import { relations, sql, } from 'drizzle-orm';
import * as ps from 'drizzle-orm/pg-core';
import { pgTable, uuid, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

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
    weakTopics: text('weak_topics').array(), // Update to match DB real type
    weakQuestionTypes: text('weak_question_types').array(),
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
}, (table) => {
    return {
        dimensionTypeCheck: ps.check('user_metric_proficiency_dimension_type_check', sql`${table.dimensionType} IN ('core_metric', 'genre', 'question_type', 'reasoning_step', 'error_pattern', 'difficulty')`),
    }
});

// =============================================================================
// Content & Exam Tables
// =============================================================================

export const articles = pgTable('articles', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title'),
    url: text('url').notNull().unique(),
    source_name: text('source_name'),
    author: text('author'),
    published_at: timestamp('published_at', { mode: 'date' }),
    genre: text('genre').notNull(),
    topic_tags: text('topic_tags').array(), // text[]
    used_in_daily: boolean('used_in_daily').default(false),
    used_in_custom_exam: boolean('used_in_custom_exam').default(false),
    daily_usage_count: integer('daily_usage_count').default(0),
    custom_exam_usage_count: integer('custom_exam_usage_count').default(0),
    last_used_at: timestamp('last_used_at', { withTimezone: true }),
    semantic_hash: text('semantic_hash'),
    extraction_model: text('extraction_model'),
    extraction_version: text('extraction_version'),
    is_safe_source: boolean('is_safe_source').default(true),
    is_archived: boolean('is_archived').default(false),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    semantic_ideas_and_persona: text('semantic_ideas_and_persona'), // jsonb
});

export const coreMetrics = pgTable('core_metrics', {
    key: text('key').primaryKey(),
    description: text('description').notNull(),
    version: text('version').default('v1.0').notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    mapping_logic: text('mapping_logic').notNull(),
});

export const genres = pgTable('genres', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    description: text('description'),
    daily_usage_count: integer('daily_usage_count').default(0),
    custom_exam_usage_count: integer('custom_exam_usage_count').default(0),
    last_used_daily_at: timestamp('last_used_daily_at', { withTimezone: true }),
    last_used_custom_exam_at: timestamp('last_used_custom_exam_at', { withTimezone: true }),
    cooldown_days: integer('cooldown_days').default(2),
    avg_difficulty_score: text('avg_difficulty_score'), // numeric
    preferred_question_types: text('preferred_question_types').array(),
    is_active: boolean('is_active').default(true),
    is_high_priority: boolean('is_high_priority').default(false),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const examPapers = pgTable('exam_papers', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    year: integer('year'),
    exam_type: text('exam_type').default('CAT'),
    slot: text('slot'),
    is_official: boolean('is_official').default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    used_articles_id: uuid('used_articles_id').array(),
    generated_by_user_id: uuid('generated_by_user_id').references(() => users.id, { onDelete: 'cascade' }),
    time_limit_minutes: integer('time_limit_minutes'),
    generation_status: text('generation_status').default('completed'),
    updated_at: timestamp('updated_at', { withTimezone: true }),
});

export const passages = pgTable('passages', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 200 }),
    content: text('content').notNull(),
    word_count: integer('word_count').notNull(),
    genre: varchar('genre', { length: 50 }).notNull(),
    difficulty: varchar('difficulty', { length: 20 }).notNull(),
    source: varchar('source', { length: 100 }),
    generation_model: varchar('generation_model', { length: 50 }),
    generation_prompt_version: varchar('generation_prompt_version', { length: 20 }),
    generation_cost_cents: integer('generation_cost_cents'),
    quality_score: text('quality_score'), // numeric
    times_used: integer('times_used').default(0),
    avg_completion_time_seconds: integer('avg_completion_time_seconds'),
    avg_accuracy: text('avg_accuracy'), // numeric
    is_daily_pick: boolean('is_daily_pick').default(false),
    is_featured: boolean('is_featured').default(false),
    is_archived: boolean('is_archived').default(false),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    paper_id: uuid('paper_id').references(() => examPapers.id, { onDelete: 'cascade' }),
    article_id: uuid('article_id').references(() => articles.id),
});

export const practiceSessions = pgTable('practice_sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
    session_type: varchar('session_type', { length: 30 }).notNull(),
    mode: varchar('mode', { length: 20 }),
    passage_ids: uuid('passage_ids').array(),
    question_ids: uuid('question_ids').array(),
    target_difficulty: varchar('target_difficulty', { length: 20 }),
    target_genres: text('target_genres').array(),
    target_question_types: text('target_question_types').array(),
    time_limit_seconds: integer('time_limit_seconds'),
    time_spent_seconds: integer('time_spent_seconds').default(0),
    started_at: timestamp('started_at', { withTimezone: true }).defaultNow(),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    paused_at: timestamp('paused_at', { withTimezone: true }),
    pause_duration_seconds: integer('pause_duration_seconds').default(0),
    total_questions: integer('total_questions').default(0),
    correct_answers: integer('correct_answers').default(0),
    score_percentage: text('score_percentage'), // numeric
    points_earned: integer('points_earned').default(0),
    status: varchar('status', { length: 20 }).default('in_progress'),
    current_question_index: integer('current_question_index').default(0),
    session_data: text('session_data'), // jsonb
    is_group_session: boolean('is_group_session').default(false),
    group_id: uuid('group_id'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    paper_id: uuid('paper_id').references(() => examPapers.id, { onDelete: 'cascade' }),
    is_analysed: boolean('is_analysed').default(false),
    analytics: text('analytics'), // jsonb
});

export const questionTypes = pgTable('question_types', {
    key: text('key').primaryKey(),
    description: text('description').notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const questions = pgTable('questions', {
    id: uuid('id').primaryKey().defaultRandom(),
    passage_id: uuid('passage_id').references(() => passages.id, { onDelete: 'cascade' }),
    question_text: text('question_text').notNull(),
    question_type: varchar('question_type', { length: 30 }).notNull(),
    options: text('options'), // jsonb
    correct_answer: text('correct_answer').notNull(), // jsonb
    jumbled_sentences: text('jumbled_sentences'), // jsonb
    rationale: text('rationale').notNull(),
    rationale_model: varchar('rationale_model', { length: 50 }),
    hints: text('hints'), // jsonb
    difficulty: varchar('difficulty', { length: 20 }),
    tags: text('tags').array(), // text[]
    quality_score: text('quality_score'), // numeric
    times_answered: integer('times_answered').default(0),
    times_correct: integer('times_correct').default(0),
    avg_time_seconds: integer('avg_time_seconds'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    paper_id: uuid('paper_id').references(() => examPapers.id, { onDelete: 'cascade' }),
});

export const questionAttempts = pgTable('question_attempts', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
    session_id: uuid('session_id').notNull().references(() => practiceSessions.id, { onDelete: 'cascade' }),
    question_id: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
    passage_id: uuid('passage_id').references(() => passages.id, { onDelete: 'cascade' }),
    user_answer: text('user_answer'), // jsonb
    is_correct: boolean('is_correct').notNull(),
    time_spent_seconds: integer('time_spent_seconds').notNull(),
    confidence_level: integer('confidence_level'),
    marked_for_review: boolean('marked_for_review').default(false),
    eliminated_options: text('eliminated_options').array(), // text[]
    hint_used: boolean('hint_used').default(false),
    hints_viewed: integer('hints_viewed').default(0),
    rationale_viewed: boolean('rationale_viewed').default(false),
    rationale_helpful: boolean('rationale_helpful'),
    user_notes: text('user_notes'),
    ai_grading_score: text('ai_grading_score'), // numeric
    ai_feedback: text('ai_feedback'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
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
        fields: [practiceSessions.user_id],
        references: [userProfiles.id],
    }),
    attempts: many(questionAttempts),
    paper: one(examPapers, {
        fields: [practiceSessions.paper_id],
        references: [examPapers.id],
    }),
}));

export const questionAttemptsRelations = relations(questionAttempts, ({ one }) => ({
    session: one(practiceSessions, {
        fields: [questionAttempts.session_id],
        references: [practiceSessions.id],
    }),
    question: one(questions, {
        fields: [questionAttempts.question_id],
        references: [questions.id],
    }),
    user: one(userProfiles, {
        fields: [questionAttempts.user_id],
        references: [userProfiles.id],
    }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
    passage: one(passages, {
        fields: [questions.passage_id],
        references: [passages.id],
    }),
    attempts: many(questionAttempts),
}));

export const passagesRelations = relations(passages, ({ one, many }) => ({
    questions: many(questions),
    article: one(articles, {
        fields: [passages.article_id],
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

// =============================================================================
// Graph Tables (Reasoning Graph)
// =============================================================================
export const graphNodes = pgTable('graph_nodes', {
    id: uuid('id').primaryKey().defaultRandom(),
    label: text('label').notNull(),
    type: varchar('type', { length: 50 }),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const graphEdges = pgTable('graph_edges', {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceNodeId: uuid('source_node_id').notNull().references(() => graphNodes.id, { onDelete: 'cascade' }),
    targetNodeId: uuid('target_node_id').notNull().references(() => graphNodes.id, { onDelete: 'cascade' }),
    relationship: text('relationship').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const graphEdgesRelations = relations(graphEdges, ({ one }) => ({
    sourceNode: one(graphNodes, {
        fields: [graphEdges.sourceNodeId],
        references: [graphNodes.id],
        relationName: 'sourceNode',
    }),
    targetNode: one(graphNodes, {
        fields: [graphEdges.targetNodeId],
        references: [graphNodes.id],
        relationName: 'targetNode',
    }),
}));

export type GraphNode = typeof graphNodes.$inferSelect;
export type GraphEdge = typeof graphEdges.$inferSelect;
