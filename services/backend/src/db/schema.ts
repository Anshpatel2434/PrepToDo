import { relations, sql, } from 'drizzle-orm';
import * as ps from 'drizzle-orm/pg-core';
import { pgTable, uuid, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

// =============================================================================
// Users Table (in public schema)
// =============================================================================
// =============================================================================
// Users Table (in public schema)
// =============================================================================
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    encrypted_password: varchar('encrypted_password', { length: 255 }),
    email_confirmed_at: timestamp('email_confirmed_at', { withTimezone: true }),
    last_sign_in_at: timestamp('last_sign_in_at', { withTimezone: true }),

    // Provider info
    provider: varchar('provider', { length: 50 }).default('email'),
    google_id: varchar('google_id', { length: 255 }),

    // Metadata
    raw_app_meta_data: text('raw_app_meta_data'),
    raw_user_meta_data: text('raw_user_meta_data'),
    is_sso_user: boolean('is_sso_user').default(false),
    role: varchar('role', { length: 20 }).default('user'), // Added for admin access

    // Timestamps
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),

    // Quotas
    ai_insights_remaining: integer('ai_insights_remaining').default(20),
    customized_mocks_remaining: integer('customized_mocks_remaining').default(2),
});

// ... (skipping to relations)



// =============================================================================
// Auth Sessions Table
// =============================================================================
export const authSessions = pgTable('auth_sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    refresh_token_hash: varchar('refresh_token_hash', { length: 255 }).notNull(),
    user_agent: text('user_agent'),
    ip: varchar('ip', { length: 45 }),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// Pending Signups Table (for OTP verification flow)
// =============================================================================
export const authPendingSignups = pgTable('auth_pending_signups', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    otp_hash: varchar('otp_hash', { length: 255 }).notNull(),
    attempts: varchar('attempts', { length: 10 }).default('0'),
    otp_send_count: integer('otp_send_count').default(1), // Track how many times OTP was sent
    banned_until: timestamp('banned_until', { withTimezone: true }), // Ban timestamp for rate limiting
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// Password Reset Tokens Table
// =============================================================================
export const authPasswordResetTokens = pgTable('auth_password_reset_tokens', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    token_hash: varchar('token_hash', { length: 255 }).notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    used_at: timestamp('used_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// Admin Panel Tables
// =============================================================================

// 1. AI Cost Log
export const adminAiCostLog = pgTable('admin_ai_cost_log', {
    id: uuid('id').primaryKey().defaultRandom(),
    worker_type: text('worker_type').notNull(),
    function_name: text('function_name').notNull(),
    model_name: text('model_name').default('gpt-4o-mini').notNull(),
    input_tokens: integer('input_tokens').default(0).notNull(),
    output_tokens: integer('output_tokens').default(0).notNull(),
    cost_usd: ps.decimal('cost_usd', { precision: 14, scale: 9 }).default('0').notNull(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    exam_id: uuid('exam_id').references(() => examPapers.id, { onDelete: 'set null' }), // Using examPapers as the table name is exam_papers
    session_id: uuid('session_id').references(() => practiceSessions.id, { onDelete: 'set null' }),
    metadata: ps.jsonb('metadata'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 2. Platform Metrics Daily
export const adminPlatformMetricsDaily = pgTable('admin_platform_metrics_daily', {
    id: uuid('id').primaryKey().defaultRandom(),
    date: ps.date('date').notNull().unique(),
    total_users: integer('total_users').default(0),
    new_users_today: integer('new_users_today').default(0),
    active_users_today: integer('active_users_today').default(0),
    total_sessions: integer('total_sessions').default(0),
    sessions_today: integer('sessions_today').default(0),
    total_questions_attempted: integer('total_questions_attempted').default(0),
    questions_attempted_today: integer('questions_attempted_today').default(0),
    total_passages_generated: integer('total_passages_generated').default(0),
    passages_generated_today: integer('passages_generated_today').default(0),
    total_exams_generated: integer('total_exams_generated').default(0),
    exams_generated_today: integer('exams_generated_today').default(0),
    ai_cost_today_usd: ps.decimal('ai_cost_today_usd', { precision: 14, scale: 9 }).default('0'),
    ai_cost_cumulative_usd: ps.decimal('ai_cost_cumulative_usd', { precision: 14, scale: 9 }).default('0'),
    avg_session_duration_seconds: integer('avg_session_duration_seconds').default(0),
    avg_accuracy_percentage: ps.decimal('avg_accuracy_percentage', { precision: 5, scale: 2 }),
    revenue_today_cents: integer('revenue_today_cents').default(0),
    revenue_cumulative_cents: integer('revenue_cumulative_cents').default(0),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 3. User Activity Log (Admin View)
export const adminUserActivityLog = pgTable('admin_user_activity_log', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    event_type: text('event_type').notNull(),
    metadata: ps.jsonb('metadata'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// User Profiles Table
// =============================================================================
export const userProfiles = pgTable('user_profiles', {
    id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    username: varchar('username', { length: 50 }).notNull().unique(),
    display_name: varchar('display_name', { length: 100 }),
    avatar_url: text('avatar_url'),
    subscription_tier: varchar('subscription_tier', { length: 20 }).default('free'),
    subscription_expires_at: timestamp('subscription_expires_at', { withTimezone: true }),
    daily_goal_minutes: integer('daily_goal_minutes').default(30),
    preferred_difficulty: varchar('preferred_difficulty', { length: 20 }).default('medium'),
    theme: varchar('theme', { length: 20 }).default('light'),
    data_consent_given: boolean('data_consent_given').default(false),
    show_on_leaderboard: boolean('show_on_leaderboard').default(true),
    last_active_at: timestamp('last_active_at', { withTimezone: true }).defaultNow(),
    email: text('email').unique(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// User Analytics Table
// =============================================================================
export const userAnalytics = pgTable('user_analytics', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().unique().references(() => userProfiles.id, { onDelete: 'cascade' }),
    minutes_practiced: integer('minutes_practiced').default(0),
    questions_attempted: integer('questions_attempted').default(0),
    questions_correct: integer('questions_correct').default(0),
    accuracy_percentage: integer('accuracy_percentage').default(0),
    is_active_day: boolean('is_active_day').default(false),
    current_streak: integer('current_streak').default(0),
    longest_streak: integer('longest_streak').default(0),
    points_earned_today: integer('points_earned_today').default(0),
    total_points: integer('total_points').default(0),
    genre_performance: text('genre_performance'), // JSONB stored as text
    difficulty_performance: text('difficulty_performance'),
    question_type_performance: text('question_type_performance'),
    new_words_learned: integer('new_words_learned').default(0),
    words_reviewed: integer('words_reviewed').default(0),
    last_active_date: varchar('last_active_date', { length: 20 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// User Proficiency Signals Table
// =============================================================================
export const userProficiencySignals = pgTable('user_proficiency_signals', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().unique().references(() => userProfiles.id, { onDelete: 'cascade' }),
    overall_percentile: integer('overall_percentile'),
    estimated_cat_percentile: integer('estimated_cat_percentile'),
    genre_strengths: text('genre_strengths'), // JSONB stored as text
    inference_skill: integer('inference_skill'),
    tone_analysis_skill: integer('tone_analysis_skill'),
    main_idea_skill: integer('main_idea_skill'),
    detail_comprehension_skill: integer('detail_comprehension_skill'),
    recommended_difficulty: varchar('recommended_difficulty', { length: 20 }),
    weak_topics: text('weak_topics').array(), // Update to match DB real type
    weak_question_types: text('weak_question_types').array(),
    calculated_at: timestamp('calculated_at', { withTimezone: true }).defaultNow(),
    data_points_count: integer('data_points_count'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// User Metric Proficiency Table
// =============================================================================
export const userMetricProficiency = pgTable('user_metric_proficiency', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
    dimension_type: text('dimension_type').notNull(),
    dimension_key: text('dimension_key').notNull(),
    proficiency_score: integer('proficiency_score').notNull(),
    confidence_score: varchar('confidence_score', { length: 10 }).notNull(),
    total_attempts: integer('total_attempts').default(0),
    correct_attempts: integer('correct_attempts').default(0),
    last_session_id: uuid('last_session_id'),
    trend: text('trend'),
    speed_vs_accuracy_data: text('speed_vs_accuracy_data'), // JSONB stored as text
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        dimensionTypeCheck: ps.check('user_metric_proficiency_dimension_type_check', sql`${table.dimension_type} IN ('core_metric', 'genre', 'question_type', 'reasoning_step', 'error_pattern', 'difficulty')`),
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

export const examGenerationState = pgTable('exam_generation_state', {
    exam_id: uuid('exam_id').primaryKey().references(() => examPapers.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    current_step: integer('current_step').default(1),
    total_steps: integer('total_steps').default(7),
    articles_data: ps.jsonb('articles_data'),
    passages_ids: text('passages_ids').array(),
    rc_question_ids: text('rc_question_ids').array(),
    va_question_ids: text('va_question_ids').array(),
    reference_passages_content: text('reference_passages_content').array(),
    reference_data_rc: ps.jsonb('reference_data_rc'),
    reference_data_va: ps.jsonb('reference_data_va'),
    user_id: uuid('user_id'),
    params: ps.jsonb('params').notNull(),
    error_message: text('error_message'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    genre: text('genre'),
}, (table) => {
    return {
        statusCheck: ps.check('exam_generation_state_status_check', sql`${table.status} IN ('initializing', 'generating_passages', 'generating_rc_questions', 'generating_va_questions', 'selecting_answers', 'generating_rc_rationales', 'generating_va_rationales', 'completed', 'failed')`),
    }
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
    generation_cost_usd: ps.decimal('generation_cost_usd', { precision: 14, scale: 9 }),
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
    practiceSessions: many(practiceSessions),
    passwordResetTokens: many(authPasswordResetTokens),
    profile: one(userProfiles, {
        fields: [users.id],
        references: [userProfiles.id],
    }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
    user: one(users, {
        fields: [authSessions.user_id],
        references: [users.id],
    }),
}));

export const authPasswordResetTokensRelations = relations(authPasswordResetTokens, ({ one }) => ({
    user: one(users, {
        fields: [authPasswordResetTokens.user_id],
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

export const adminUserActivityLogRelations = relations(adminUserActivityLog, ({ one }) => ({
    user: one(users, {
        fields: [adminUserActivityLog.user_id],
        references: [users.id],
    }),
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
export type ExamGenerationState = typeof examGenerationState.$inferSelect;
export type NewExamGenerationState = typeof examGenerationState.$inferInsert;

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
});

export const graphEdges = pgTable('graph_edges', {
    id: uuid('id').primaryKey().defaultRandom(),
    source_node_id: uuid('source_node_id').notNull().references(() => graphNodes.id, { onDelete: 'cascade' }),
    target_node_id: uuid('target_node_id').notNull().references(() => graphNodes.id, { onDelete: 'cascade' }),
    relationship: text('relationship').notNull(),
});

export const graphEdgesRelations = relations(graphEdges, ({ one }) => ({
    sourceNode: one(graphNodes, {
        fields: [graphEdges.source_node_id],
        references: [graphNodes.id],
        relationName: 'sourceNode',
    }),
    targetNode: one(graphNodes, {
        fields: [graphEdges.target_node_id],
        references: [graphNodes.id],
        relationName: 'targetNode',
    }),
}));

export type GraphNode = typeof graphNodes.$inferSelect;
export type GraphEdge = typeof graphEdges.$inferSelect;
