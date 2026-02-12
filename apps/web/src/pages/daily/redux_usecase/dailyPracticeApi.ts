// dailyPracticeApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { PracticeSession, QuestionAttempt, UUID, Question, Passage, Exam, Article } from "../../../types";

interface LeaderboardEntry {
    rank: number;
    user_id: UUID;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    score: number;
    accuracy: number;
    time_taken_seconds: number;
    questions_attempted: number;
    avg_time_per_question: number;
}

interface LeaderboardData {
    leaderboard: LeaderboardEntry[];
    currentUserRank: number | null;
    totalParticipants: number;
}

interface TestDataState {
    examInfo: Exam;
    passages: Passage[];
    questions: Question[];
}

// For /today endpoint - only returns exam info
interface TodayTestDataState {
    examInfo: Exam | null;
}

interface StartDailySessionQuery {
    user_id: UUID;
    paper_id: UUID;
    passage_ids?: UUID[];
    question_ids?: UUID[];
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

interface FetchExistingSessionQuery {
    user_id: UUID;
    paper_id: UUID;
    session_type: "daily_challenge_rc" | "daily_challenge_va";
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

export const dailyPracticeApi = createApi({
    reducerPath: "dailyPracticeApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${BACKEND_URL}/api/daily-content`,
        credentials: 'include', // Include cookies for auth, removing strict dependency on Supabase client
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('preptodo_access_token');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ["DailyPractice", "Session", "Attempts"],
    endpoints: (builder) => ({
        // Get today's exam info (no questions/passages)
        fetchDailyTestData: builder.query<TodayTestDataState, void>({
            query: () => "/today",
            transformResponse: (response: ApiResponse<TodayTestDataState>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch daily test data');
                }
                return response.data;
            },
            providesTags: ["DailyPractice"],
        }),

        // Get specific exam details (public - no content)
        fetchDailyTestDetails: builder.query<TodayTestDataState, string>({
            query: (exam_id) => `/details/${exam_id}`,
            transformResponse: (response: ApiResponse<TodayTestDataState>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch exam details');
                }
                return response.data;
            },
        }),

        // Get previous daily practice tests with pagination
        fetchPreviousDailyTests: builder.query<Exam[], { page?: number; limit?: number }>({
            query: ({ page = 1, limit = 20 }) => ({
                url: "/previous",
                params: { page, limit },
            }),
            transformResponse: (response: ApiResponse<Exam[]>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch previous tests');
                }
                return response.data;
            },
            providesTags: ["DailyPractice"],
        }),

        // Get specific daily test by exam_id
        fetchDailyTestById: builder.query<TestDataState, { exam_id: UUID; include_solutions?: boolean }>({
            query: ({ exam_id, include_solutions }) => ({
                url: `/${exam_id}`,
                params: { include_solutions },
            }),
            transformResponse: (response: ApiResponse<TestDataState>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch test data');
                }
                return response.data;
            },
            providesTags: ["DailyPractice"],
        }),

        // Start the session for RC
        startDailyRCSession: builder.mutation<PracticeSession, StartDailySessionQuery>({
            query: (body) => ({
                url: "/session/rc/start",
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<PracticeSession>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to start RC session');
                }
                return response.data;
            },
            invalidatesTags: ["Session"],
        }),

        // Start the session for VA
        startDailyVASession: builder.mutation<PracticeSession, StartDailySessionQuery>({
            query: (body) => ({
                url: "/session/va/start",
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<PracticeSession>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to start VA session');
                }
                return response.data;
            },
            invalidatesTags: ["Session"],
        }),

        // Fetch existing session details (for resuming)
        fetchExistingSessionDetails: builder.query<
            { session: PracticeSession; attempts: QuestionAttempt[] }, FetchExistingSessionQuery>({
                query: (params) => ({
                    url: "/session/existing",
                    params: {
                        user_id: params.user_id,
                        paper_id: params.paper_id,
                        session_type: params.session_type,
                    }
                }),
                transformResponse: (response: ApiResponse<{ session: PracticeSession; attempts: QuestionAttempt[] }>) => {
                    if (!response.success) {
                        throw new Error(response.error?.message || 'Failed to fetch existing session');
                    }
                    return response.data;
                },
                providesTags: ["Session", "Attempts"],
            }),

        // Save session details (update existing session)
        saveSessionDetails: builder.mutation<PracticeSession, SaveSessionDetailsQuery>({
            query: (body) => ({
                url: "/session/save",
                method: "PUT",
                body,
            }),
            transformResponse: (response: ApiResponse<PracticeSession>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to save session details');
                }
                return response.data;
            },
            invalidatesTags: ["Session"],
        }),

        // Save question attempts (batch upsert)
        saveQuestionAttempts: builder.mutation<QuestionAttempt[], SaveQuestionAttemptsQuery>({
            query: (body) => ({
                url: "/attempts/save",
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<QuestionAttempt[]>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to save question attempts');
                }
                return response.data;
            },
            invalidatesTags: ["Attempts"],
        }),

        // Fetch articles by IDs
        fetchArticlesByIds: builder.query<Article[], { article_ids: UUID[] }>({
            query: (body) => ({
                url: "/articles",
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<Article[]>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch articles');
                }
                return response.data;
            },
            providesTags: ["DailyPractice"],
        }),

        // Fetch leaderboard for a specific exam
        fetchDailyLeaderboard: builder.query<LeaderboardData, { exam_id: UUID }>({
            query: ({ exam_id }) => `/leaderboard/${exam_id}`,
            transformResponse: (response: ApiResponse<LeaderboardData>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch leaderboard');
                }
                return response.data;
            },
        }),
    }),
});

export const {
    useFetchDailyTestDataQuery,
    useFetchPreviousDailyTestsQuery,
    useFetchDailyTestDetailsQuery,
    useFetchDailyTestByIdQuery,
    useStartDailyRCSessionMutation,
    useStartDailyVASessionMutation,
    useFetchExistingSessionDetailsQuery,
    useLazyFetchExistingSessionDetailsQuery,
    useSaveSessionDetailsMutation,
    useSaveQuestionAttemptsMutation,
    useFetchArticlesByIdsQuery,
    useFetchDailyLeaderboardQuery,
} = dailyPracticeApi;