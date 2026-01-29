import z from "zod";

/* =========================================================
    📊 Analytics Core Schemas
   ========================================================= */

export const AttemptDatumSchema = z.object({
    attempt_id: z.string(),
    question_id: z.string(),
    passage_id: z.string().nullish(),
    question_type: z.string(),
    genre: z.string().nullish(),
    correct: z.boolean(),
    time_spent_seconds: z.number(),
    confidence_level: z.number().nullish(),
    // Critical: metric keys from question.tags
    metric_keys: z.array(z.string()),
    // For LLM diagnostics (Phase C)
    user_answer: z.any(),
    question_text: z.string().optional(),
    options: z.any().optional(),
    correct_answer: z.any().optional(),
    jumbled_sentences: z.any().optional(),
});

export type AttemptDatum = z.infer<typeof AttemptDatumSchema>;

export const DimensionStatsSchema = z.object({
    attempts: z.number(),
    correct: z.number(),
    accuracy: z.number(),
    avg_time: z.number(),
    score_0_100: z.number(),
});

export type DimensionStats = z.infer<typeof DimensionStatsSchema>;

export const SurfaceStatsSchema = z.object({
    core_metric: z.map(z.string(), DimensionStatsSchema),
    genre: z.map(z.string(), DimensionStatsSchema),
    question_type: z.map(z.string(), DimensionStatsSchema),
    reasoning_step: z.map(z.string(), DimensionStatsSchema),
});

export type SurfaceStats = z.infer<typeof SurfaceStatsSchema>;

export const MetricMappingSchema = z.object({
    metricToNodes: z.map(z.string(), z.set(z.string())),
    nodeToMetrics: z.map(z.string(), z.set(z.string())),
});

export type MetricMapping = z.infer<typeof MetricMappingSchema>;

/* =========================================================
    🔍 Diagnostic & Result Schemas
   ========================================================= */

export const DiagnosticResultSchema = z.object({
    attempt_id: z.string(),

    // Personalized analysis in natural, conversational language  
    analysis: z.string(), // Main explanation of why THIS user got it wrong (formerly personalized_analysis)
    action: z.string(), // Specific, actionable next steps for this user (formerly targeted_advice)
    performance: z.string().nullish(), // Contextual encouragement based on strengths (formerly strength_comparison)
    focus_areas: z.array(z.string()), // Specific skills to work on
    
    // User-specific context (for internal use, not displayed directly)
    related_weak_areas: z.array(z.object({
        dimension_type: z.string(),
        dimension_key: z.string(),
        proficiency_score: z.number(),
        human_readable_description: z.string(), // Natural language description
    })).nullish(),

    // Existing technical fields (kept for backward compatibility and supplementary info)
    dominant_reasoning_failures: z.array(
        z.object({
            reasoning_node_label: z.string(),
            failure_description: z.string(),
        })
    ),
    error_pattern_keys: z.array(z.string()),
    trap_analysis: z.string().nullish(),
});

export type DiagnosticResult = z.infer<typeof DiagnosticResultSchema>;

export const DiagnosticsOutputSchema = z.object({
    diagnostics: z.array(DiagnosticResultSchema),
});

export type DiagnosticsOutput = z.infer<typeof DiagnosticsOutputSchema>;

export const PhaseAResultSchema = z.object({
    alreadyAnalysed: z.boolean(),
    session: z.any(),
    dataset: z.array(AttemptDatumSchema),
    sessionMetadata: z.object({
        session_id: z.string(),
        user_id: z.string(),
        completed_at: z.string(),
        session_type: z.string(),
    }).optional(),
});

export type PhaseAResult = z.infer<typeof PhaseAResultSchema>;

export const AnalyticsResultSchema = z.object({
    success: z.boolean(),
    session_id: z.string().optional(),
    user_id: z.string().optional(),
    stats: z
        .object({
            sessions_processed: z.number().optional(),
            total_attempts: z.number(),
            correct_attempts: z.number(),
            dimensions_updated: z.object({
                core_metrics: z.number(),
                genres: z.number(),
                question_types: z.number(),
            }),
        })
        .optional(),
    message: z.string().optional(),
});

export type AnalyticsResult = z.infer<typeof AnalyticsResultSchema>;

/* =========================================================
   📝 Question Attempts
   ========================================================= */

export const QuestionAttemptSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    session_id: z.string(),
    question_id: z.string(),
    passage_id: z.string().nullish(),
    user_answer: z.any().nullish(), // {"user_answer" : "answer"}
    is_correct: z.boolean(),
    time_spent_seconds: z.number(),
    confidence_level: z.number().min(1).max(5).nullish(),
    marked_for_review: z.boolean(),
    rationale_viewed: z.boolean(),
    rationale_helpful: z.boolean().nullish(),
    ai_feedback: z.string().nullish(),
    created_at: z.string(),
});

export type QuestionAttempt = z.infer<typeof QuestionAttemptSchema>;

export const QuestionAttemptArraySchema = z.array(QuestionAttemptSchema);

export const PracticeSessionSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    paper_id: z.string(),
    session_type: z.enum([
        "practice",
        "timed_test",
        "daily_challenge_rc",
        "daily_challenge_va",
        "mock_exam",
        "vocab_review",
        "microlearning",
        "drill",
        "group_practice",
    ]),
    mode: z.string().nullish(),
    passage_ids: z.array(z.string()).nullish(),
    question_ids: z.array(z.string()),
    target_difficuly: z.string().nullish(),
    target_genres: z.array(z.string()).nullish(),
    target_question_types: z.array(z.string()).nullish(),
    time_limit_seconds: z.number().nullish(),
    time_spent_seconds: z.number(),
    started_at: z.string(),
    completed_at: z.string(),
    paused_at: z.string().nullish(),
    pause_duration_seconds: z.number(),
    total_questions: z.number(),
    correct_answers: z.number(),
    current_question_index: z.number(),
    is_group_session: z.boolean(),
    group_id: z.string().nullish(),
    status: z.enum(["in_progress", "completed", "abandoned", "paused"]),
    score_percentage: z.number(),
    points_earned: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    analytics: z.any().nullish(),
    is_analysed: z.boolean().default(false),
});

export type PracticeSession = z.infer<typeof PracticeSessionSchema>;

/* =========================================================
   ❓ Questions
   ========================================================= */

export const QuestionSchema = z.object({
    id: z.string(),
    passage_id: z.string().nullish(),
    question_text: z.string(),
    question_type: z.enum([
        "rc_question",
        "true_false",
        "inference",
        "tone",
        "purpose",
        "detail",
        "para_jumble",
        "para_summary",
        "para_completion",
        "critical_reasoning",
        "vocab_in_context",
        "odd_one_out",
    ]),
    options: z.any().nullish(),
    jumbled_sentences: z.any().nullish(),
    correct_answer: z.any(), //{"answer" : "answer"}
    rationale: z.string(),
    difficulty: z.enum(["easy", "medium", "hard", "expert"]).nullish(),
    tags: z.array(z.string()).nullish(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Question = z.infer<typeof QuestionSchema>;
export const QuestionArraySchema = z.array(QuestionSchema);

/* =========================================================
   📄 Passages
   ========================================================= */

export const PassageSchema = z.object({
    id: z.string(),
    title: z.string().nullish(),
    content: z.string(),
    word_count: z.number(),
    genre: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    source: z.string().nullish(),
    paper_id: z.string().nullish(),
    is_daily_pick: z.boolean(),
    is_featured: z.boolean(),
    is_archived: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Passage = z.infer<typeof PassageSchema>;
export const PassageArraySchema = z.array(PassageSchema);

/* =========================================================
    📈 User Metric Proficiency
    (Tracks granular skill levels across dimensions)
   ========================================================= */

export const UserMetricProficiencySchema = z.object({
    id: z.string(),
    user_id: z.string(),
    dimension_type: z.enum([
        "core_metric",
        "genre",
        "question_type",
        "reasoning_step",
        "error_pattern",
    ]),
    dimension_key: z.string(),
    proficiency_score: z.number().int().min(0).max(100),
    confidence_score: z.number().min(0).max(1),
    total_attempts: z.number().int().default(0),
    correct_attempts: z.number().int().default(0),
    last_session_id: z.string().nullish(),
    trend: z.enum(["improving", "declining", "stagnant"]).nullish(),
    updated_at: z.string(), // ISO Timestamp
    created_at: z.string(), // ISO Timestamp
    speed_vs_accuracy_data: z.any().nullish(), // JSONB for speed vs accuracy analysis
});

export type UserMetricProficiency = z.infer<typeof UserMetricProficiencySchema>;

/* =========================================================
    🎯 User Proficiency Signals
    (Aggregated high-level insights and CAT-specific metrics)
   ========================================================= */

export const UserProficiencySignalsSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    overall_percentile: z.number().int().min(0).max(100).nullish(),
    estimated_cat_percentile: z.number().int().min(0).max(100).nullish(),

    // JSONB structure: typically Record<string, number> for scores
    genre_strengths: z.array(z.any()).nullish(),

    // inference_skill: z.number().int().min(0).max(100).nullish(),
    // tone_analysis_skill: z.number().int().min(0).max(100).nullish(),
    // main_idea_skill: z.number().int().min(0).max(100).nullish(),
    // detail_comprehension_skill: z.number().int().min(0).max(100).nullish(),

    recommended_difficulty: z.string().max(20).nullish(),
    weak_topics: z.array(z.string()).nullish(),
    weak_question_types: z.array(z.string()).nullish(),

    calculated_at: z.string().nullish(),
    data_points_count: z.number().int().nullish(),
    created_at: z.string().nullish(),
    updated_at: z.string().nullish(),
});

export type UserProficiencySignals = z.infer<typeof UserProficiencySignalsSchema>;

/* =========================================================
    📦 Batch Types (Optional Helpers)
   ========================================================= */

export const UserMetricProficiencyArraySchema = z.array(UserMetricProficiencySchema);
export type UserMetricProficiencyArray = z.infer<typeof UserMetricProficiencyArraySchema>;

/* =========================================================
     📊 User Analytics
     (Single row per user with cumulative analytics)
    ========================================================= */

export const UserAnalyticsSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    last_active_date: z.string(), // YYYY-MM-DD format - last date user was active
    minutes_practiced: z.number().int().default(0),
    questions_attempted: z.number().int().default(0),
    questions_correct: z.number().int().default(0),
    accuracy_percentage: z.number().min(0).max(100).nullish(),
    current_streak: z.number().int().default(0),
    longest_streak: z.number().int().default(0),
    points_earned_today: z.number().int().default(0),
    total_points: z.number().int().default(0),
    genre_performance: z.any().nullish(),
    difficulty_performance: z.any().nullish(),
    question_type_performance: z.any().nullish(),
    new_words_learned: z.number().int().default(0),
    words_reviewed: z.number().int().default(0),
    created_at: z.string().nullish(),
    updated_at: z.string().nullish(),
});

export const UserAnalyticsArraySchema = z.array(UserAnalyticsSchema)

export type UserAnalytics = z.infer<typeof UserAnalyticsSchema>;