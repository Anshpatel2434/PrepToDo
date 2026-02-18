import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { UUID } from "../../../types";
import { dailyPracticeApi } from "../../daily/redux_usecase/dailyPracticeApi";
import { customizedMocksApi } from "../../customized-mocks/redux_usecase/customizedMocksApi";

// =============================================================================
// Interfaces
// =============================================================================

export interface GenerateInsightRequest {
    session_id: UUID;
    question_id: UUID;
    attempt_id: UUID;
}

export interface GenerateInsightResponse {
    diagnostic: any; // Using any for now as the diagnostic structure is complex/flexible
    already_existed: boolean;
    ai_insights_remaining: number;
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

export const aiInsightsApi = createApi({
    reducerPath: "aiInsightsApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${BACKEND_URL}/api/ai-insights`,
        credentials: 'include', // Include cookies for auth
    }),
    tagTypes: ["AIInsights"],
    endpoints: (builder) => ({
        generateInsight: builder.mutation<GenerateInsightResponse, GenerateInsightRequest>({
            query: (body) => ({
                url: "/generate",
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<GenerateInsightResponse>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to generate insight');
                }
                return response.data;
            },
            // Invalidate session tags to refresh analytics data across the app
            onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    // Trigger refetch of current session data in daily/mock pages
                    dispatch(dailyPracticeApi.util.invalidateTags(["Session"]));
                    dispatch(customizedMocksApi.util.invalidateTags(["MockSessions"]));
                } catch {
                    // Ignore errors, mutation will handle its own error state
                }
            },
        }),
    }),
});

export const {
    useGenerateInsightMutation,
} = aiInsightsApi;
