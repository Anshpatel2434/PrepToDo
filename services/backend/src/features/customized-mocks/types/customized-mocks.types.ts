
import {
    examPapers,
    passages,
    questions,
    questionAttempts,
    practiceSessions,
    genres,
    userMetricProficiency
} from '../../../db/schema';

export type Exam = typeof examPapers.$inferSelect;
export type Passage = typeof passages.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type QuestionAttempt = typeof questionAttempts.$inferSelect;
export type PracticeSession = typeof practiceSessions.$inferSelect;
export type Genre = typeof genres.$inferSelect;
export type UserMetricProficiency = typeof userMetricProficiency.$inferSelect;

// Request interfaces
export interface CreateCustomizedMockRequest {
    user_id: string;
    mock_name?: string;
    target_genres?: string[];
    num_passages?: number;
    total_questions?: number;
    question_type_distribution?: {
        rc_questions?: number;
        para_summary?: number;
        para_completion?: number;
        para_jumble?: number;
        odd_one_out?: number;
    };
    difficulty_target?: "easy" | "medium" | "hard" | "mixed";
    target_metrics?: string[];
    weak_areas_to_address?: string[];
    time_limit_minutes?: number;
    per_question_time_limit?: number;
    user_analytics?: {
        accuracy_percentage?: number;
        genre_performance?: Record<string, number>;
        question_type_performance?: Record<string, number>;
        weak_topics?: string[];
        weak_question_types?: string[];
        reading_speed_wpm?: number;
    };
}

export interface StartMockSessionRequest {
    user_id: string;
    paper_id: string;
    passage_ids?: string[];
    question_ids?: string[];
    time_limit_seconds?: number;
}

export interface SaveSessionDetailsRequest {
    session_id: string;
    time_spent_seconds: number;
    completed_at?: string;
    status: "in_progress" | "completed" | "abandoned" | "paused";
    total_questions: number;
    correct_answers: number;
    score_percentage: number;
    current_question_index: number;
}

export interface SaveQuestionAttemptsRequest {
    attempts: Omit<QuestionAttempt, "id" | "created_at">[];
}

// Response interfaces
export interface CustomizedMockWithSession extends Exam {
    session_status: "not_started" | "in_progress" | "completed" | null;
    session_id?: string;
    passages_count?: number;
    questions_count?: number;
    generation_status: "completed" | "generating" | "initializing" | "failed";
}

export interface GenerationStateResponse {
    state: {
        exam_id: string;
        status: string;
        current_step: number;
        total_steps: number;
        error_message?: string;
        created_at: string;
        updated_at: string;
    } | null;
    isGenerating: boolean;
}

export interface CheckSessionResponse {
    has_session: boolean;
    session?: PracticeSession;
    status: "not_started" | "in_progress" | "completed" | null;
}

export interface TestDataResponse {
    examInfo: Exam;
    passages: Passage[];
    questions: Question[];
}
