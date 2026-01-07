// types.ts
import {z} from "zod"

export const UUIDSchema = z.string().uuid();
export const TimestampSchema = z.string(); // ISO string from Supabase
export const JSONSchema = z.any();

export type UUID = z.infer<typeof UUIDSchema>

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
    passage_id: UUIDSchema,
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