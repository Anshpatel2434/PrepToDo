export type GenerationStatus =
    | 'initializing'
    | 'generating_passages'
    | 'generating_rc_questions'
    | 'generating_va_questions'
    | 'selecting_answers'
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
    articles_data?: any[];
    passages_ids?: string[];
    rc_question_ids?: string[];
    va_question_ids?: string[];

    // Reference data for question generation
    reference_passages_content?: string[];
    reference_data_rc?: any[];
    reference_data_va?: any[];

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
