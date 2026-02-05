// =============================================================================
// Daily Content Feature - Types
// =============================================================================

import { z } from 'zod';

// =============================================================================
// Request Types
// =============================================================================

export interface GenerateDailyContentRequest {
    // Optional: can be triggered manually or via cron
    force?: boolean; // Force generation even if today's content exists
}

export interface FetchDailyTestRequest {
    // No params needed - fetches today's test
}

export interface FetchDailyTestByIdRequest {
    exam_id: string;
}

export interface FetchPreviousDailyTestsRequest {
    page?: number;
    limit?: number;
}

export interface StartDailySessionRequest {
    user_id: string;
    paper_id: string;
    session_type: 'daily_challenge_rc' | 'daily_challenge_va';
    passage_ids?: string[];
    question_ids?: string[];
}

export interface SaveSessionDetailsRequest {
    session_id: string;
    time_spent_seconds: number;
    completed_at?: string;
    status: 'in_progress' | 'completed' | 'abandoned' | 'paused';
    total_questions: number;
    correct_answers: number;
    score_percentage: number;
    current_question_index: number;
}

export interface SaveQuestionAttemptsRequest {
    attempts: Array<{
        user_id: string;
        session_id: string;
        question_id: string;
        passage_id?: string | null;
        user_answer: any;
        is_correct: boolean;
        time_spent_seconds: number;
        confidence_level?: number | null;
        marked_for_review: boolean;
        rationale_viewed: boolean;
        rationale_helpful?: boolean | null;
        ai_feedback?: string | null;
    }>;
}

export interface FetchExistingSessionRequest {
    user_id: string;
    paper_id: string;
    session_type: 'daily_challenge_rc' | 'daily_challenge_va';
}

export interface FetchLeaderboardRequest {
    exam_id: string;
    user_id: string;
}

// =============================================================================
// Response Types
// =============================================================================

export interface DailyContentGenerationResponse {
    success: boolean;
    exam_id: string;
    message: string;
    stats?: {
        passages_created: number;
        questions_created: number;
        rc_questions: number;
        va_questions: number;
    };
}

export interface TestDataResponse {
    examInfo: any; // Exam type from DB
    passages: any[]; // Passage type from DB
    questions: any[]; // Question type from DB
}

export interface LeaderboardEntry {
    rank: number;
    user_id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    score: number;
    accuracy: number;
    time_taken_seconds: number;
    questions_attempted: number;
    avg_time_per_question: number;
}

export interface LeaderboardResponse {
    leaderboard: LeaderboardEntry[];
    currentUserRank: number | null;
    totalParticipants: number;
}

export interface SessionWithAttemptsResponse {
    session: any; // PracticeSession type from DB
    attempts: any[]; // QuestionAttempt type from DB
}

// =============================================================================
// Internal Worker Types
// =============================================================================

export interface DailyContentOutput {
    exam: {
        id: string;
        name: string;
        year: number;
        exam_type: string;
        time_limit_minutes: number;
        used_articles_id: string[];
        generation_status: string;
    };
    passage: {
        id: string;
        title: string | null;
        content: string;
        word_count: number;
        genre: string;
        difficulty: string;
        source: string | null;
        paper_id: string;
    };
    questions: Array<{
        id: string;
        passage_id: string | null;
        question_text: string;
        question_type: string;
        options?: any;
        jumbled_sentences?: any;
        correct_answer: any;
        rationale: string;
        difficulty: string;
        tags: string[];
        paper_id: string;
    }>;
}

// =============================================================================
// Validation Schemas
// =============================================================================

export const GenerateDailyContentSchema = z.object({
    force: z.boolean().optional(),
});

export const FetchDailyTestByIdSchema = z.object({
    exam_id: z.string().uuid(),
});

export const FetchPreviousDailyTestsSchema = z.object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
});

export const StartDailySessionSchema = z.object({
    user_id: z.string().uuid(),
    paper_id: z.string().uuid(),
    session_type: z.enum(['daily_challenge_rc', 'daily_challenge_va']),
    passage_ids: z.array(z.string().uuid()).optional(),
    question_ids: z.array(z.string().uuid()).optional(),
});

export const SaveSessionDetailsSchema = z.object({
    session_id: z.string().uuid(),
    time_spent_seconds: z.number().int().nonnegative(),
    completed_at: z.string().optional(),
    status: z.enum(['in_progress', 'completed', 'abandoned', 'paused']),
    total_questions: z.number().int().nonnegative(),
    correct_answers: z.number().int().nonnegative(),
    score_percentage: z.number().min(0).max(100),
    current_question_index: z.number().int().nonnegative(),
});

export const SaveQuestionAttemptsSchema = z.object({
    attempts: z.array(z.object({
        user_id: z.string().uuid(),
        session_id: z.string().uuid(),
        question_id: z.string().uuid(),
        passage_id: z.string().uuid().nullable().optional(),
        user_answer: z.any(),
        is_correct: z.boolean(),
        time_spent_seconds: z.number().int().nonnegative(),
        confidence_level: z.number().int().min(1).max(5).nullable().optional(),
        marked_for_review: z.boolean(),
        rationale_viewed: z.boolean(),
        rationale_helpful: z.boolean().nullable().optional(),
        ai_feedback: z.string().nullable().optional(),
    })),
});

export const FetchExistingSessionSchema = z.object({
    user_id: z.string().uuid(),
    paper_id: z.string().uuid(),
    session_type: z.enum(['daily_challenge_rc', 'daily_challenge_va']),
});

export const FetchLeaderboardSchema = z.object({
    exam_id: z.string().uuid(),
    user_id: z.string().uuid(),
});
