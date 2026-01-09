import { z } from "zod";

/* =========================================================
   🔹 Shared Primitives
   ========================================================= */

export const UUIDSchema = z.string().uuid();
export const TimestampSchema = z.string(); // ISO string from Supabase
export const JSONSchema = z.any();

export type UUID = z.infer<typeof UUIDSchema>

/* =========================================================
   👤 User & Profile
   ========================================================= */

export const UserSchema = z.object({
    id: UUIDSchema,
    email: z.string().email(),
    confirmationToken: z.string().optional(),
});

export const UserProfileSchema = z.object({
    id: UUIDSchema,
    username: z.string(),
    display_name: z.string().nullable(),
    avatar_url: z.string().nullable(),
    subscription_tier: z.enum(["free", "pro", "premium"]),
    preferred_difficulty: z.enum(["easy", "medium", "hard", "adaptive"]),
    theme: z.enum(["light", "dark", "auto"]),
    daily_goal_minutes: z.number(),
    show_on_leaderboard: z.boolean(),
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
});

export type UserItem = z.infer<typeof UserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;

/* =========================================================
   📚 Theory & Knowledge Base
   ========================================================= */

export const TheoryChunkSchema = z.object({
    id: UUIDSchema,
    topic: z.string(),
    sub_topic: z.string(),
    concept_title: z.string(),
    content: z.string(),
    example_text: z.string().nullable(),
    source_pdf: z.string().nullable(),
    page_number: z.number().nullable(),
    created_at: TimestampSchema,
});

export type TheoryChunk = z.infer<typeof TheoryChunkSchema>;

/* =========================================================
   📄 Exams
   ========================================================= */

export const ExamSchema = z.object({
    id: UUIDSchema,
    name: z.string(),
    year: z.number(),
    exam_type: z.string(),
    slot: z.string(),
    is_official: z.boolean(),
    created_at: TimestampSchema
})

export type Exam = z.infer<typeof ExamSchema>

/* =========================================================
   📄 Passages
   ========================================================= */

export const PassageSchema = z.object({
    id: UUIDSchema,
    title: z.string().nullable(),
    content: z.string(),
    word_count: z.number(),
    genre: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    source: z.string().nullable(),
    paper_id: UUIDSchema.nullable(),
    is_daily_pick: z.boolean(),
    is_featured: z.boolean(),
    is_archived: z.boolean(),
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
});

export type Passage = z.infer<typeof PassageSchema>;

/* =========================================================
   ❓ Questions
   ========================================================= */

export const QuestionSchema = z.object({
    id: UUIDSchema,
    passage_id: UUIDSchema.nullable(),
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
    options: JSONSchema.optional(),
    jumbled_sentences : JSONSchema.optional(),
    correct_answer: JSONSchema, //{"answer" : "answer"}
    rationale: z.string(),
    difficulty: z.enum(["easy", "medium", "hard", "expert"]).nullable(),
    tags: z.array(z.string()).nullable(),
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
});

export type Question = z.infer<typeof QuestionSchema>;

/* =========================================================
   🧠 Embeddings (AI / RAG)
   ========================================================= */

export const EmbeddingSchema = z.object({
    id: UUIDSchema,
    embedding_model: z.string(),
    theory_id: UUIDSchema.nullable(),
    passage_id: UUIDSchema.nullable(),
    question_id: UUIDSchema.nullable(),
    content_preview: z.string().nullable(),
    metadata: z.record(z.string(), z.any()).nullable(),
    created_at: TimestampSchema,
});

export type Embedding = z.infer<typeof EmbeddingSchema>;

/* =========================================================
   🏃 Practice Sessions
   ========================================================= */

export const PracticeSessionSchema = z.object({
    id: UUIDSchema,
    user_id: UUIDSchema,
    paper_id: UUIDSchema,
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
    mode: z.enum(["tutor", "test", "adaptive"]).nullable(),
    passage_ids: z.array(UUIDSchema).nullable(),
    question_ids: z.array(UUIDSchema).nullable(),
    target_difficuly: z.string(),
    target_genres: z.array(z.string()),
    target_question_types: z.array(z.string()),
    time_limit_seconds: z.number().nullable(),
    time_spent_seconds: z.number(),
    started_at: TimestampSchema,
    completed_at: TimestampSchema,
    paused_at: TimestampSchema,
    pause_duration_seconds: z.number(),
    total_questions: z.number(),
    correct_answers: z.number(),
    current_question_index : z.number(),
    is_group_session: z.boolean(),
    group_id: UUIDSchema,
    status: z.enum(["in_progress", "completed", "abandoned", "paused"]),
    score_percentage: z.number().nullable(),
    points_earned: z.number(),
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
});

export type PracticeSession = z.infer<typeof PracticeSessionSchema>;

/* =========================================================
   📝 Question Attempts
   ========================================================= */

export const QuestionAttemptSchema = z.object({
    id: UUIDSchema,
    user_id: UUIDSchema,
    session_id: UUIDSchema,
    question_id: UUIDSchema,
    passage_id: UUIDSchema.nullable(),
    user_answer: JSONSchema, // {"user_answer" : "answer"}
    is_correct: z.boolean(),
    time_spent_seconds: z.number(),
    confidence_level: z.number().min(1).max(5).nullable(),
    marked_for_review: z.boolean(),
    rationale_viewed: z.boolean(),
    rationale_helpful: z.boolean(),
    ai_feedback: z.string().nullable(),
    created_at: TimestampSchema,
});

export type QuestionAttempt = z.infer<typeof QuestionAttemptSchema>;

/* =========================================================
   📊 User Analytics
   ========================================================= */

export const UserAnalyticsSchema = z.object({
    id: UUIDSchema,
    user_id: UUIDSchema,
    date: z.string(), // YYYY-MM-DD
    minutes_practiced: z.number(),
    questions_attempted: z.number(),
    questions_correct: z.number(),
    accuracy_percentage: z.number().nullable(),
    current_streak: z.number(),
    longest_streak: z.number(),
    total_points: z.number(),
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
});

export type UserAnalytics = z.infer<typeof UserAnalyticsSchema>;

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
   📖 Vocabulary
   ========================================================= */

export const VocabEntrySchema = z.object({
    id: UUIDSchema,
    word: z.string(),
    definition: JSONSchema,
    part_of_speech: z.string().nullable(),
    difficulty_level: z
        .enum(["basic", "intermediate", "advanced", "expert"])
        .nullable(),
    mnemonic: z.string().nullable(),
    synonyms: z.array(z.string()).nullable(),
    antonyms: z.array(z.string()).nullable(),
    created_at: TimestampSchema,
});

export type VocabEntry = z.infer<typeof VocabEntrySchema>;

export const UserVocabProgressSchema = z.object({
    id: UUIDSchema,
    user_id: UUIDSchema,
    vocab_id: UUIDSchema,
    mastery_level: z.number().min(0).max(5),
    times_reviewed: z.number(),
    next_review_at: TimestampSchema,
    created_at: TimestampSchema,
});

export type UserVocabProgress = z.infer<typeof UserVocabProgressSchema>;

/* =========================================================
   🏆 Leaderboard
   ========================================================= */

export const LeaderboardEntrySchema = z.object({
    id: UUIDSchema,
    leaderboard_type: z.enum([
        "daily",
        "weekly",
        "monthly",
        "all_time",
        "genre_specific",
    ]),
    user_id: UUIDSchema,
    rank: z.number(),
    score: z.number(),
    accuracy_percentage: z.number().nullable(),
    created_at: TimestampSchema,
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const OptionSchema = z.object({
    id: z.string(),
    text: z.string(),
});

export type Option = z.infer<typeof OptionSchema>;



/* =========================================================
   🔚 END
   ========================================================= */
