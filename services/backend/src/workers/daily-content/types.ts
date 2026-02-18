// =============================================================================
// Daily Content Worker - Types
// =============================================================================
// Combined types from schemas/types.ts and types/state.ts

import { z } from "zod";

// =============================================================================
// Base Schema Helpers
// =============================================================================
export const UUIDSchema = z.string().uuid();
export const TimestampSchema = z.string();
export const JSONSchema = z.any();

export type UUID = z.infer<typeof UUIDSchema>;

// =============================================================================
// Generation State Types
// =============================================================================
export type GenerationStatus =
    | 'initializing'
    | 'generating_passage'
    | 'generating_rc_questions'
    | 'selecting_rc_answers'
    | 'generating_va_questions'
    | 'selecting_va_answers'
    | 'generating_rc_rationales'
    | 'generating_va_rationales'
    | 'completed'
    | 'failed';

export interface ExamGenerationState {
    exam_id: string;
    status: GenerationStatus;
    current_step: number;
    total_steps: number;

    // Intermediate data
    genre?: string;
    articles_data?: any[];
    passages_ids?: string[];
    rc_question_ids?: string[];
    va_question_ids?: string[];

    // Reference data for question generation
    reference_passages_content?: string[];
    reference_data_rc?: any[];
    reference_data_va?: any[];
    reasoning_graph_nodes?: any[];
    rc_reasoning_contexts?: any[];
    va_reasoning_contexts?: any[];

    // Metadata
    user_id: string;
    params: Record<string, any>;
    error_message?: string;

    created_at: string;
    updated_at: string;
}

export interface StepResult {
    success: boolean;
    exam_id: string;
    current_step?: number;
    total_steps?: number;
    next_function?: string;
    error?: string;
}

// =============================================================================
// Article Schema
// =============================================================================
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
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
});

export type Article = z.infer<typeof ArticleSchema>;

// =============================================================================
// Exam Schema
// =============================================================================
export const ExamSchema = z.object({
    id: UUIDSchema,
    name: z.string(),
    year: z.number(),
    exam_type: z.string(),
    slot: z.string().nullable(),
    is_official: z.boolean(),
    created_at: TimestampSchema,
    used_articles_id: z.array(UUIDSchema).nullish(),
    generate_by_user_id: UUIDSchema.nullish(),
});

export type Exam = z.infer<typeof ExamSchema>;

// =============================================================================
// Passage Schema
// =============================================================================
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

// =============================================================================
// Question Schema
// =============================================================================
const OptionsSchema = z.object({
    A: z.string(),
    B: z.string(),
    C: z.string(),
    D: z.string(),
});

const JumbledSentencesSchema = z.object({
    1: z.string(),
    2: z.string(),
    3: z.string(),
    4: z.string(),
    5: z.string(),
});

export const QuestionSchema = z.object({
    id: UUIDSchema,
    passage_id: UUIDSchema.nullish(),
    paper_id: UUIDSchema.nullish(),
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
    jumbled_sentences: JumbledSentencesSchema,
    correct_answer: z.object({
        answer: z.string().min(1)
    }),
    rationale: z.string(),
    difficulty: z.enum(["easy", "medium", "hard", "expert"]),
    tags: z.array(z.string()),
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
});

export type Question = z.infer<typeof QuestionSchema>;

// =============================================================================
// Question Metric Tag Schema
// =============================================================================
export const QuestionMetricTagSchema = z.object({
    question_id: z.string().uuid(),
    metric_keys: z.array(z.string()).max(2),
});

export const QuestionMetricTagArraySchema = z.array(QuestionMetricTagSchema);
export type QuestionMetricTag = z.infer<typeof QuestionMetricTagSchema>;

// =============================================================================
// Reasoning Graph Types
// =============================================================================
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

// =============================================================================
// Semantic Extraction Schemas
// =============================================================================
export const SemanticIdeasSchema = z.object({
    core_topic: z.string(),
    subtopics: z.array(z.string()).min(2),
    key_arguments: z.array(z.string()).min(3),
    implicit_assumptions: z.array(z.string()).min(1),
    areas_of_ambiguity: z.array(z.string()).min(1),
    sentence_ideas: z.array(z.string()).min(5).describe("Key sentence-level ideas for VA questions"),
    conceptual_pairs: z.array(z.object({
        idea_a: z.string(),
        idea_b: z.string(),
        relationship: z.string()
    })).min(3).describe("Pairs of related ideas for odd_one_out questions"),
    logical_transitions: z.array(z.string()).min(3).describe("Logical connectors and transitions"),
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
export type SemanticExtractionOutput = z.infer<typeof SemanticExtractionOutputSchema>;

// =============================================================================
// Daily Content Result
// =============================================================================
export interface DailyContentResult {
    success: boolean;
    exam_id?: string;
    message?: string;
    error?: string;
    stats?: {
        total_questions: number;
        rc_questions: number;
        va_questions: number;
        passage_word_count: number;
        genre: string;
    };
}
