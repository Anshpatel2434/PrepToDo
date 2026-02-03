import { pgTable, uuid, varchar, text, timestamp, boolean, integer, date, jsonb, numeric, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';
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

// =============================================================================
// Articles Table
// =============================================================================
export const articles = pgTable('articles', {
    id: uuid('id').primaryKey(),
    title: text('title'),
    url: varchar('url').notNull().unique(),
    sourceName: text('source_name'),
    author: text('author'),
    publishedAt: date('published_at'),
    genre: text('genre').notNull(),
    topicTags: text('topic_tags').array(),
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
    semanticIdeasAndPersona: jsonb('semantic_ideas_and_persona'),
});

// =============================================================================
// Genres Table
// =============================================================================
export const genres = pgTable('genres', {
    id: uuid('id').primaryKey(),
    name: varchar('name').notNull().unique(),
    description: text('description'),
    dailyUsageCount: integer('daily_usage_count').default(0),
    customExamUsageCount: integer('custom_exam_usage_count').default(0),
    lastUsedDailyAt: timestamp('last_used_daily_at', { withTimezone: true }),
    lastUsedCustomExamAt: timestamp('last_used_custom_exam_at', { withTimezone: true }),
    cooldownDays: integer('cooldown_days').default(2),
    avgDifficultyScore: numeric('avg_difficulty_score'),
    preferredQuestionTypes: text('preferred_question_types').array(),
    isActive: boolean('is_active').default(true),
    isHighPriority: boolean('is_high_priority').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// Exam Papers Table
// =============================================================================
export const examPapers = pgTable('exam_papers', {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    year: integer('year'),
    examType: text('exam_type').default('CAT'),
    slot: text('slot'),
    isOfficial: boolean('is_official').default(true),
    usedArticlesId: uuid('used_articles_id').array(),
    generatedByUserId: uuid('generated_by_user_id'),
    timeLimitMinutes: integer('time_limit_minutes'),
    generationStatus: text('generation_status').default('completed'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// =============================================================================
// Passages Table
// =============================================================================
export const passages = pgTable('passages', {
    id: uuid('id').primaryKey(),
    title: varchar('title', { length: 200 }),
    content: text('content').notNull(),
    wordCount: integer('word_count').notNull(),
    genre: varchar('genre', { length: 50 }).notNull(),
    difficulty: varchar('difficulty', { length: 20 }).notNull(),
    source: varchar('source', { length: 100 }),
    generationModel: varchar('generation_model', { length: 50 }),
    generationPromptVersion: varchar('generation_prompt_version', { length: 20 }),
    generationCostCents: integer('generation_cost_cents'),
    qualityScore: numeric('quality_score', { precision: 3, scale: 2 }),
    timesUsed: integer('times_used').default(0),
    avgCompletionTimeSeconds: integer('avg_completion_time_seconds'),
    avgAccuracy: numeric('avg_accuracy', { precision: 5, scale: 2 }),
    isDailyPick: boolean('is_daily_pick').default(false),
    isFeatured: boolean('is_featured').default(false),
    isArchived: boolean('is_archived').default(false),
    paperId: uuid('paper_id'),
    articleId: uuid('article_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// Questions Table
// =============================================================================
export const questions = pgTable('questions', {
    id: uuid('id').primaryKey(),
    passageId: uuid('passage_id'),
    questionText: text('question_text').notNull(),
    questionType: varchar('question_type', { length: 30 }).notNull(),
    options: jsonb('options'),
    correctAnswer: jsonb('correct_answer').notNull(),
    jumbledSentences: jsonb('jumbled_sentences'),
    rationale: text('rationale').notNull(),
    rationaleModel: varchar('rationale_model', { length: 50 }),
    hints: jsonb('hints'),
    difficulty: varchar('difficulty', { length: 20 }),
    tags: text('tags').array(),
    qualityScore: numeric('quality_score', { precision: 3, scale: 2 }),
    timesAnswered: integer('times_answered').default(0),
    timesCorrect: integer('times_correct').default(0),
    avgTimeSeconds: integer('avg_time_seconds'),
    paperId: uuid('paper_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// Practice Sessions Table
// =============================================================================
export const practiceSessions = pgTable('practice_sessions', {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    sessionType: varchar('session_type', { length: 30 }).notNull(),
    mode: varchar('mode', { length: 20 }),
    passageIds: uuid('passage_ids').array(),
    questionIds: uuid('question_ids').array(),
    targetDifficulty: varchar('target_difficulty', { length: 20 }),
    targetGenres: text('target_genres').array(),
    targetQuestionTypes: text('target_question_types').array(),
    timeLimitSeconds: integer('time_limit_seconds'),
    timeSpentSeconds: integer('time_spent_seconds').default(0),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    pausedAt: timestamp('paused_at', { withTimezone: true }),
    pauseDurationSeconds: integer('pause_duration_seconds').default(0),
    totalQuestions: integer('total_questions').default(0),
    correctAnswers: integer('correct_answers').default(0),
    scorePercentage: numeric('score_percentage', { precision: 5, scale: 2 }),
    pointsEarned: integer('points_earned').default(0),
    status: varchar('status', { length: 20 }).default('in_progress'),
    currentQuestionIndex: integer('current_question_index').default(0),
    sessionData: jsonb('session_data'),
    isGroupSession: boolean('is_group_session').default(false),
    groupId: uuid('group_id'),
    paperId: uuid('paper_id'),
    isAnalysed: boolean('is_analysed').default(false),
    analytics: jsonb('analytics'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// Question Attempts Table
// =============================================================================
export const questionAttempts = pgTable('question_attempts', {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    sessionId: uuid('session_id').notNull(),
    questionId: uuid('question_id').notNull(),
    passageId: uuid('passage_id'),
    userAnswer: jsonb('user_answer'),
    isCorrect: boolean('is_correct').notNull(),
    timeSpentSeconds: integer('time_spent_seconds').notNull(),
    confidenceLevel: integer('confidence_level'),
    markedForReview: boolean('marked_for_review').default(false),
    eliminatedOptions: text('eliminated_options').array(),
    hintUsed: boolean('hint_used').default(false),
    hintsViewed: integer('hints_viewed').default(0),
    rationaleViewed: boolean('rationale_viewed').default(false),
    rationaleHelpful: boolean('rationale_helpful'),
    userNotes: text('user_notes'),
    aiGradingScore: numeric('ai_grading_score', { precision: 5, scale: 2 }),
    aiFeedback: text('ai_feedback'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// Graph Nodes Table
// =============================================================================
export const graphNodes = pgTable('graph_nodes', {
    id: uuid('id').primaryKey(),
    label: text('label').unique(),
    type: text('type'),
});

// =============================================================================
// Graph Edges Table
// =============================================================================
export const graphEdges = pgTable('graph_edges', {
    id: uuid('id').primaryKey(),
    sourceNodeId: uuid('source_node_id'),
    targetNodeId: uuid('target_node_id'),
    relationship: text('relationship'),
});

// =============================================================================
// Exam Generation State Table
// =============================================================================
export const examGenerationState = pgTable('exam_generation_state', {
    examId: uuid('exam_id').primaryKey(),
    status: text('status').notNull(),
    currentStep: integer('current_step').default(1),
    totalSteps: integer('total_steps').default(7),
    articlesData: jsonb('articles_data'),
    passagesIds: text('passages_ids').array(),
    rcQuestionIds: text('rc_question_ids').array(),
    vaQuestionIds: text('va_question_ids').array(),
    referencePassagesContent: text('reference_passages_content').array(),
    referenceDataRc: jsonb('reference_data_rc'),
    referenceDataVa: jsonb('reference_data_va'),
    userId: uuid('user_id'),
    params: jsonb('params').notNull(),
    errorMessage: text('error_message'),
    genre: text('genre'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// Theory Chunks Table
// =============================================================================
export const theoryChunks = pgTable('theory_chunks', {
    id: uuid('id').primaryKey(),
    topic: text('topic').notNull(),
    subTopic: text('sub_topic').notNull(),
    conceptTitle: text('concept_title').notNull(),
    content: text('content').notNull(),
    sourcePdf: text('source_pdf'),
    pageNumber: integer('page_number'),
    exampleText: text('example_text'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Legacy alias for backwards compatibility
export const authUsers = users;
export type AuthUser = User;
export type NewAuthUser = NewUser;

// =============================================================================
// Type Exports for New Tables
// =============================================================================
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Genre = typeof genres.$inferSelect;
export type NewGenre = typeof genres.$inferInsert;
export type ExamPaper = typeof examPapers.$inferSelect;
export type NewExamPaper = typeof examPapers.$inferInsert;
export type Passage = typeof passages.$inferSelect;
export type NewPassage = typeof passages.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type PracticeSession = typeof practiceSessions.$inferSelect;
export type NewPracticeSession = typeof practiceSessions.$inferInsert;
export type QuestionAttempt = typeof questionAttempts.$inferSelect;
export type NewQuestionAttempt = typeof questionAttempts.$inferInsert;
export type GraphNode = typeof graphNodes.$inferSelect;
export type NewGraphNode = typeof graphNodes.$inferInsert;
export type GraphEdge = typeof graphEdges.$inferSelect;
export type NewGraphEdge = typeof graphEdges.$inferInsert;
export type ExamGenerationState = typeof examGenerationState.$inferSelect;
export type NewExamGenerationState = typeof examGenerationState.$inferInsert;
export type TheoryChunk = typeof theoryChunks.$inferSelect;
export type NewTheoryChunk = typeof theoryChunks.$inferInsert;
