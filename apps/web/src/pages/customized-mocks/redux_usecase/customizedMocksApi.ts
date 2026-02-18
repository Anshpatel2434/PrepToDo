import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Exam, PracticeSession, UUID, Question, Passage, QuestionAttempt, UserMetricProficiency, Genre } from "../../../types";

// =============================================================================
// Interfaces
// =============================================================================

export interface CustomizedMockRequest {
    user_id: UUID;
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
    };
}

export interface CustomizedMockWithSession extends Exam {
    session_status: "not_started" | "in_progress" | "completed" | null;
    session_id?: UUID;
    passages_count?: number;
    questions_count?: number;
    generation_status: "completed" | "generating" | "initializing" | "failed";
}

interface CreateMockResponse {
    success: boolean;
    exam_id?: UUID;
    message: string;
    mock_name?: string;
}

export interface OptimisticMock {
    id: string; // temporary ID like "temp-1234567890" or real exam_id when available
    name: string;
    created_at: string;
    generation_status: 'generating';
    isOptimistic: true; // flag to identify temporary mocks
    passages_count: 0;
    questions_count: 0;
    session_status: null;
    time_limit_minutes?: number;
    generated_by_user_id?: UUID;
    exam_id?: UUID; // Real exam_id from backend response when available
}

interface CheckSessionResponse {
    has_session: boolean;
    session?: PracticeSession;
    status: "not_started" | "in_progress" | "completed" | null;
}

interface TestDataState {
    examInfo: Exam;
    passages: Passage[];
    questions: Question[];
}

interface TestDataResponse {
    examInfo: Exam;
    passages: Passage[];
    questions: Question[];
}

interface StartMockSessionQuery {
    user_id: UUID;
    paper_id: UUID;
    passage_ids?: UUID[];
    question_ids?: UUID[];
    time_limit_seconds?: number;
}

interface SaveSessionDetailsQuery {
    session_id: UUID;
    time_spent_seconds: number;
    completed_at?: string;
    status: "in_progress" | "completed" | "abandoned" | "paused";
    total_questions: number;
    correct_answers: number;
    score_percentage: number;
    current_question_index: number;
}

interface SaveQuestionAttemptsQuery {
    attempts: Omit<QuestionAttempt, "id" | "created_at">[];
}

interface FetchExistingMockSessionQuery {
    user_id: UUID;
    paper_id: UUID;
}

// Real-time generation tracking types
export interface ExamGenerationState {
    exam_id: UUID;
    status: GenerationStatus;
    current_step: number; // 1-based index
    total_steps: number;
    error_message?: string;
    created_at: string;
    updated_at: string;
}

export type GenerationStatus =
    | "initializing"
    | "generating_passages"
    | "generating_rc_questions"
    | "generating_va_questions"
    | "selecting_answers"
    | "generating_rc_rationales"
    | "generating_va_rationales"
    | "completed"
    | "failed";

export interface GenerationStateResponse {
    state: ExamGenerationState | null;
    isGenerating: boolean;
}

// Utility function for mapping status codes to user-friendly messages
export function getStatusMessage(
    status: GenerationStatus,
    step: number,
    totalSteps: number
): {
    message: string;
    shortMessage: string;
} {
    // Validate and provide sensible defaults for missing data
    const safeStep = typeof step === 'number' && step > 0 ? step : 1;
    const safeTotalSteps = typeof totalSteps === 'number' && totalSteps > 0 ? totalSteps : 7;

    // Validate status is a known value
    const validStatuses: GenerationStatus[] = [
        "initializing",
        "generating_passages",
        "generating_rc_questions",
        "generating_va_questions",
        "selecting_answers",
        "generating_rc_rationales",
        "generating_va_rationales",
        "completed",
        "failed",
    ];

    const safeStatus = validStatuses.includes(status) ? status : "initializing";

    const stepPrefix = `Step ${safeStep}/${safeTotalSteps}:`;

    const messages: Record<
        GenerationStatus,
        { message: string; shortMessage: string }
    > = {
        initializing: {
            message: `${stepPrefix} Initializing generation...`,
            shortMessage: "Initializing...",
        },
        generating_passages: {
            message: `${stepPrefix} Creating passages...`,
            shortMessage: "Creating passages...",
        },
        generating_rc_questions: {
            message: `${stepPrefix} Generating reading comprehension questions...`,
            shortMessage: "Generating RC questions...",
        },
        generating_va_questions: {
            message: `${stepPrefix} Generating verbal ability questions...`,
            shortMessage: "Generating VA questions...",
        },
        selecting_answers: {
            message: `${stepPrefix} Selecting answer choices...`,
            shortMessage: "Selecting answers...",
        },
        generating_rc_rationales: {
            message: `${stepPrefix} Writing explanations for RC questions...`,
            shortMessage: "Writing RC explanations...",
        },
        generating_va_rationales: {
            message: `${stepPrefix} Writing explanations for VA questions...`,
            shortMessage: "Writing VA explanations...",
        },
        completed: {
            message: "Ready to start",
            shortMessage: "Ready",
        },
        failed: {
            message: "Generation failed",
            shortMessage: "Failed",
        },
    };

    return messages[safeStatus] || messages.initializing;
}

// =============================================================================
// Backend API Configuration
// =============================================================================

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: {
        code: string;
        message: string;
    };
}

export const customizedMocksApi = createApi({
    reducerPath: "customizedMocksApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${BACKEND_URL}/api/customized-mocks`,
        credentials: 'include', // Include cookies for auth
    }),
    tagTypes: ["CustomizedMocks", "MockSessions", "UserMetricProficiency", "GenerationState"],
    endpoints: (builder) => ({
        // Fetch user metric proficiency for recommendations
        fetchUserMetricProficiency: builder.query<UserMetricProficiency[], UUID>({
            query: (userId) => ({
                url: `/proficiency`,
                params: { user_id: userId }
            }),
            transformResponse: (response: ApiResponse<UserMetricProficiency[]>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch metric proficiency');
                }
                return response.data;
            },
            providesTags: (_result, _error, userId) => [
                { type: "UserMetricProficiency", id: userId },
            ],
        }),

        // Fetch all available genres
        fetchAvailableGenres: builder.query<Genre[], void>({
            query: () => ({
                url: '/genres'
            }),
            transformResponse: (response: ApiResponse<Genre[]>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch genres');
                }
                return response.data;
            },
        }),

        // Fetch all customized mocks created by the current user
        fetchCustomizedMocks: builder.query<CustomizedMockWithSession[], void>({
            query: () => ({
                url: '/list'
            }),
            transformResponse: (response: ApiResponse<CustomizedMockWithSession[]>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch customized mocks');
                }
                return response.data;
            },
            providesTags: ["CustomizedMocks"],
        }),

        // Create a new customized mock
        createCustomizedMock: builder.mutation<CreateMockResponse, CustomizedMockRequest>({
            query: (params) => ({
                url: '/create',
                method: 'POST',
                body: params
            }),
            transformResponse: (response: ApiResponse<CreateMockResponse>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to create customized mock');
                }
                return response.data;
            },
            async onQueryStarted(params, { dispatch, queryFulfilled }) {
                const tempId = `temp-${Date.now()}`;
                const optimisticMock: OptimisticMock = {
                    id: tempId,
                    name: params.mock_name || "Customized Mock",
                    created_at: new Date().toISOString(),
                    generation_status: 'generating',
                    isOptimistic: true,
                    passages_count: 0,
                    questions_count: 0,
                    session_status: null,
                    time_limit_minutes: params.time_limit_minutes,
                    generated_by_user_id: params.user_id,
                };

                const patchResult = dispatch(
                    customizedMocksApi.util.updateQueryData('fetchCustomizedMocks', undefined, (draft) => {
                        draft.unshift(optimisticMock as unknown as CustomizedMockWithSession);
                    })
                );

                try {
                    const { data: result } = await queryFulfilled;

                    if (result.success && result.exam_id) {
                        dispatch(
                            customizedMocksApi.util.updateQueryData('fetchCustomizedMocks', undefined, (draft) => {
                                const mockIndex = draft.findIndex(m => m.id === tempId);
                                if (mockIndex !== -1) {
                                    // Use explicit cast or Object.assign to update the draft safely
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const mock = draft[mockIndex] as any;
                                    if (mock) {
                                        mock.exam_id = result.exam_id;
                                    }
                                }
                            })
                        );
                    }
                } catch {
                    patchResult.undo();
                }
            },
            invalidatesTags: ["CustomizedMocks"],
        }),

        // Check if user has an existing session for a mock
        checkExistingSession: builder.query<CheckSessionResponse, { paper_id: UUID }>({
            query: ({ paper_id }) => ({
                url: '/session/check',
                params: { paper_id }
            }),
            transformResponse: (response: ApiResponse<CheckSessionResponse>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to check session');
                }
                return response.data;
            },
            providesTags: ["MockSessions"],
        }),

        // Fetch mock test data by exam ID
        fetchMockTestById: builder.query<TestDataState, { exam_id: UUID; include_solutions?: boolean }>({
            query: ({ exam_id, include_solutions }) => ({
                url: `/${exam_id}/details`,
                params: { include_solutions }
            }),
            transformResponse: (response: ApiResponse<TestDataResponse>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch mock test data');
                }
                return {
                    examInfo: response.data.examInfo,
                    passages: response.data.passages || [],
                    questions: response.data.questions || [],
                };
            },
            providesTags: ["CustomizedMocks"],
        }),

        // Start a new mock session
        startMockSession: builder.mutation<PracticeSession, StartMockSessionQuery & { time_limit_seconds?: number }>({
            query: (body) => ({
                url: '/session/start',
                method: 'POST',
                body
            }),
            transformResponse: (response: ApiResponse<PracticeSession>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to start mock session');
                }
                return response.data;
            },
            invalidatesTags: ["MockSessions"],
        }),

        // Fetch existing session details
        fetchExistingMockSession: builder.query<
            { session: PracticeSession; attempts: QuestionAttempt[] }, FetchExistingMockSessionQuery>({
                query: ({ user_id, paper_id }) => ({
                    url: '/session/existing',
                    params: { user_id, paper_id }
                }),
                transformResponse: (response: ApiResponse<{ session: PracticeSession; attempts: QuestionAttempt[] }>) => {
                    if (!response.success) {
                        throw new Error(response.error?.message || 'Failed to fetch existing session');
                    }
                    return response.data;
                },
                providesTags: ["MockSessions"],
            }),

        // Save session details
        saveMockSessionDetails: builder.mutation<PracticeSession, SaveSessionDetailsQuery>({
            query: (body) => ({
                url: '/session/save',
                method: 'PUT',
                body
            }),
            transformResponse: (response: ApiResponse<PracticeSession>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to save session details');
                }
                return response.data;
            },
            invalidatesTags: ["MockSessions"],
        }),

        // Save question attempts
        saveMockQuestionAttempts: builder.mutation<QuestionAttempt[], SaveQuestionAttemptsQuery>({
            query: (body) => ({
                url: '/attempts/save',
                method: 'POST',
                body
            }),
            transformResponse: (response: ApiResponse<QuestionAttempt[]>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to save question attempts');
                }
                return response.data;
            },
        }),

        // Fetch generation status
        fetchGenerationStatus: builder.query<GenerationStateResponse, { exam_id: UUID }>({
            query: ({ exam_id }) => ({
                url: `/${exam_id}/status`
            }),
            transformResponse: (response: ApiResponse<GenerationStateResponse>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch generation status');
                }
                return response.data;
            },
            providesTags: ["GenerationState"],
        }),
    }),
});

export const {
    useFetchUserMetricProficiencyQuery,
    useFetchAvailableGenresQuery,
    useFetchCustomizedMocksQuery,
    useCreateCustomizedMockMutation,
    useCheckExistingSessionQuery,
    useLazyCheckExistingSessionQuery,
    useFetchMockTestByIdQuery,
    useLazyFetchMockTestByIdQuery,
    useStartMockSessionMutation,
    useFetchExistingMockSessionQuery,
    useLazyFetchExistingMockSessionQuery,
    useSaveMockSessionDetailsMutation,
    useSaveMockQuestionAttemptsMutation,
    useFetchGenerationStatusQuery,
} = customizedMocksApi;
