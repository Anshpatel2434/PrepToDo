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

// 1. Define a concrete Options schema instead of a generic JSONSchema
const OptionsSchema = z.object({
    A: z.string(),
    B: z.string(),
    C: z.string(),
    D: z.string(),
});

// 1. Define a concrete Options schema instead of a generic JSONSchema
const JumbledSentencesSchema = z.object({
    1: z.string(),
    2: z.string(),
    3: z.string(),
    4: z.string(),
});

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
    options: OptionsSchema,
    jumbled_sentences: JumbledSentencesSchema,
    correct_answer: z.object({
        answer: z.string()
    }), //{"answer" : "answer"}
    rationale: z.string(),
    difficulty: z.enum(["easy", "medium", "hard", "expert"]).nullable(),
    tags: z.array(z.string()), // Use empty array [] instead of nullable
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
});

export type Question = z.infer<typeof QuestionSchema>;

export const QuestionNodeTagSchema = z.object({
    question_id: z.string().uuid(),
    primary_node_id: z.string().uuid(),
    secondary_node_ids: z.array(z.string().uuid()).max(2),
});

export const QuestionNodeTagArraySchema = z.array(QuestionNodeTagSchema);

export type QuestionNodeTag = z.infer<typeof QuestionNodeTagSchema>;

export type ReasoningGraphContext = {
    primary_node: {
        id: string;
        label: string;
        type: "ReasoningStep";
    };
    edges: {
        relationship: string; // supports | misleads_into | requires | validates
        target_node: {
            id: string;
            label: string;
            type: string;
        };
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