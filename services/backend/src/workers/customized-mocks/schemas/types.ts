// types.ts
import { z } from "zod"

export const UUIDSchema = z.string().uuid();
export const TimestampSchema = z.string(); // ISO string from Supabase
export const JSONSchema = z.any();

export type UUID = z.infer<typeof UUIDSchema>

/* =========================================================
   📄 Articles
   ========================================================= */

export const ArticleSchema = z.object({
    id: UUIDSchema,
    title: z.string().nullish(),
    url: z.string().nullish(),
    source_name: z.string().nullish(),
    author: z.string().nullish(),
    published_at: z.coerce.date().nullish(),
    genre: z.string(),
    topic_tags: z.array(z.string()).nullish(),
    used_in_daily: z.boolean().default(false),
    used_in_custom_exam: z.boolean().default(false),
    daily_usage_count: z.number().int().nonnegative().default(0),
    custom_exam_usage_count: z.number().int().nonnegative().default(0),
    last_used_at: z.coerce.date().nullish(),
    semantic_hash: z.string().nullish(),
    extraction_model: z.string().nullish(),
    extraction_version: z.string().nullish(),
    is_safe_source: z.boolean().default(true),
    is_archived: z.boolean().default(false),
    notes: z.string().nullish(),
    created_at: z.coerce.date().nullish(),
    updated_at: z.coerce.date().nullish(),
});

export type Article = z.infer<typeof ArticleSchema>;

/* =========================================================
   📄 Exams
   ========================================================= */

export const ExamSchema = z.object({
    id: UUIDSchema,
    name: z.string(),
    year: z.number(),
    exam_type: z.string(),
    slot: z.string().nullish(),
    is_official: z.boolean(),
    created_at: TimestampSchema,
    used_articles_id: z.array(UUIDSchema).nullish(),
    generated_by_user_id: UUIDSchema.nullish(), // Fixed field name
    time_limit_minutes: z.number().int().nullish(),
    updated_at: TimestampSchema.optional(),
})

export type Exam = z.infer<typeof ExamSchema>;

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

// 1. Define a concrete Options schema instead of a generic JSONSchema
const OptionsSchema = z.object({
    A: z.string(),
    B: z.string(),
    C: z.string(),
    D: z.string(),
});

// 1. Define a concrete Jumbled Sentences schema instead of a generic JSONSchema
const JumbledSentencesSchema = z.object({
    1: z.string(),
    2: z.string(),
    3: z.string(),
    4: z.string(),
    5: z.string(),
});

export const QuestionSchema = z.object({
    id: UUIDSchema,
    passage_id: UUIDSchema.nullish(), // Made nullable for VA questions
    paper_id: UUIDSchema.nullish(), // Added missing paper_id field
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
    options: OptionsSchema,
    jumbled_sentences: JumbledSentencesSchema.nullish(), // Made nullable for non-jumble questions
    correct_answer: z.object({
        answer: z.string()
    }), //{"answer" : "answer"}
    rationale: z.string(),
    difficulty: z.enum(["easy", "medium", "hard", "expert"]),
    tags: z.array(z.string()), // Use empty array [] instead of nullable
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
});

export type Question = z.infer<typeof QuestionSchema>;

export const QuestionMetricTagSchema = z.object({
    question_id: z.string().uuid(),
    metric_keys: z.array(z.string()).max(2),
});

export const QuestionMetricTagArraySchema = z.array(QuestionMetricTagSchema);

export type QuestionMetricTag = z.infer<typeof QuestionMetricTagSchema>;

export type ReasoningGraphContext = {
    metric_keys: string[];
    nodes: {
        node_id: string;
        label: string;
        justification: string;
    }[];
    edges: {
        relationship: string;
        source_node_label: string;
        target_node_label: string;
    }[];
};

export type Node = {
    id: string;
    label: string;
    type: "ReasoningStep";
};

export type Edge = {
    source_node_id: string;
    target_node_id: string;
    relationship: string;
};

export const SemanticIdeasSchema = z.object({
    core_topic: z.string(),
    subtopics: z.array(z.string()).min(2),
    key_arguments: z.array(z.string()).min(3),
    implicit_assumptions: z.array(z.string()).min(1),
    areas_of_ambiguity: z.array(z.string()).min(1),
    // Additional fields for VA questions
    sentence_ideas: z.array(z.string()).min(5).describe("Key sentence-level ideas that can form the basis of para_jumble, para_summary, para_completion questions"),
    conceptual_pairs: z.array(z.object({
        idea_a: z.string(),
        idea_b: z.string(),
        relationship: z.string()
    })).min(3).describe("Pairs of related ideas for odd_one_out questions"),
    logical_transitions: z.array(z.string()).min(3).describe("Logical connectors and transitions used in the text"),
});

export const AuthorialPersonaSchema = z.object({
    stance_type: z.enum([
        "critical",
        "revisionist",
        "skeptical",
        "corrective",
        "warning-driven",
    ]),
    evaluative_intensity: z.enum(["low", "medium", "high"]),
    typical_moves: z.array(z.string()).min(2),
    syntactic_traits: z.array(z.string()).min(2),
    closure_style: z.enum(["open-ended", "cautionary", "unresolved"]),
});

export const SemanticExtractionOutputSchema = z.object({
    semantic_ideas: SemanticIdeasSchema,
    authorial_persona: AuthorialPersonaSchema,
});

export type SemanticIdeas = z.infer<typeof SemanticIdeasSchema>;
export type AuthorialPersona = z.infer<typeof AuthorialPersonaSchema>;
export type SemanticExtractionOutput = z.infer<
    typeof SemanticExtractionOutputSchema
>;

/* =========================================================
   🎯 Customized Mock Request Schema
   ========================================================= */

export const CustomizedMockRequestSchema = z.object({
    user_id: UUIDSchema,
    mock_name: z.string().nullish().default("Custom Mock Test"),
    // Content specifications
    target_genres: z.array(z.string()).nullish(),
    num_passages: z.number().int().min(1).max(5).default(1),
    total_questions: z.number().int().min(5).max(50).default(15),
    // Question type distribution
    question_type_distribution: z.object({
        rc_questions: z.number().int().nonnegative().default(0),
        para_summary: z.number().int().nonnegative().default(1),
        para_completion: z.number().int().nonnegative().default(1),
        para_jumble: z.number().int().nonnegative().default(1),
        odd_one_out: z.number().int().nonnegative().default(1),
    }).nullish(),
    // Difficulty targeting
    difficulty_target: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
    // Personalization parameters
    target_metrics: z.array(z.string()).nullish(), // Specific core metrics to target
    weak_areas_to_address: z.array(z.string()).nullish(), // Weak question types/genres to focus on
    // Time constraints
    time_limit_minutes: z.number().int().min(10).max(180).nullish(), // nullish time limit for the entire mock
    per_question_time_limit: z.number().int().min(30).max(300).nullish(), // nullish per-question time limit
    // User analytics (for personalization)
    user_analytics: z.object({
        accuracy_percentage: z.number().nullish(),
        genre_performance: z.any().nullish(),
        question_type_performance: z.any().nullish(),
        weak_topics: z.array(z.string()).nullish(),
        weak_question_types: z.array(z.string()).nullish(),
    }).nullish(),
    // Exam ID for tracking
    exam_id: UUIDSchema.optional(),
});

export type CustomizedMockRequest = z.infer<typeof CustomizedMockRequestSchema>;

/* =========================================================
   📦 Customized Mock Result Schema
   ========================================================= */

export const CustomizedMockResultSchema = z.object({
    success: z.boolean(),
    exam_id: UUIDSchema.nullish(),
    mock_name: z.string().nullish(),
    passage_count: z.number(),
    question_count: z.number(),
    user_id: UUIDSchema,
    time_limit_minutes: z.number().nullish(),
    message: z.string(),
});

export type CustomizedMockResult = z.infer<typeof CustomizedMockResultSchema>;
