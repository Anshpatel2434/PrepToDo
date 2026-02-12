import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
    UserAnalytics,
    UserMetricProficiency,
    UserProfile,
    UserProficiencySignals,
} from "../../../types";

// =============================================================================
// Backend API Configuration
// =============================================================================
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// =============================================================================
// Response Types
// =============================================================================
interface DashboardDataResponse {
    profile: UserProfile | null;
    analytics: UserAnalytics | null;
    proficiencySignals: UserProficiencySignals | null;
    metricProficiency: UserMetricProficiency[];
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: {
        code: string;
        message: string;
    };
}

// =============================================================================
// Dashboard API
// =============================================================================
export const dashboardApi = createApi({
    reducerPath: "dashboardApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${BACKEND_URL}/api/dashboard`,
        credentials: 'include', // Include cookies for auth
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('preptodo_access_token');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: [
        "Dashboard",
        "UserAnalytics",
        "UserMetricProficiency",
        "UserProficiencySignals",
        "UserProfile",
    ],
    endpoints: (builder) => ({
        // Combined dashboard data (single optimized request)
        fetchDashboardData: builder.query<DashboardDataResponse, void>({
            query: () => '/',
            transformResponse: (response: ApiResponse<DashboardDataResponse>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch dashboard data');
                }
                return response.data;
            },
            providesTags: ["Dashboard"],
        }),

        // Individual endpoints (for targeted refreshes)
        fetchUserAnalytics: builder.query<UserAnalytics | null, void>({
            query: () => '/analytics',
            transformResponse: (response: ApiResponse<{ analytics: UserAnalytics | null }>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch analytics');
                }
                return response.data.analytics;
            },
            providesTags: ["UserAnalytics", "Dashboard"],
        }),

        fetchUserProficiencySignals: builder.query<UserProficiencySignals | null, void>({
            query: () => '/proficiency-signals',
            transformResponse: (response: ApiResponse<{ proficiencySignals: UserProficiencySignals | null }>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch proficiency signals');
                }
                return response.data.proficiencySignals;
            },
            providesTags: ["UserProficiencySignals", "Dashboard"],
        }),

        fetchUserMetricProficiency: builder.query<UserMetricProficiency[], void>({
            query: () => '/metric-proficiency',
            transformResponse: (response: ApiResponse<{ metricProficiency: UserMetricProficiency[] }>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch metric proficiency');
                }
                return response.data.metricProficiency;
            },
            providesTags: ["UserMetricProficiency", "Dashboard"],
        }),

        fetchUserProfile: builder.query<UserProfile | null, void>({
            query: () => '/profile',
            transformResponse: (response: ApiResponse<{ profile: UserProfile | null }>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to fetch profile');
                }
                return response.data.profile;
            },
            providesTags: ["UserProfile", "Dashboard"],
        }),

        // Update profile (including username)
        updateUserProfile: builder.mutation<UserProfile, Partial<UserProfile> & { username?: string }>({
            query: (updates) => ({
                url: '/profile',
                method: 'PATCH',
                body: updates,
            }),
            transformResponse: (response: ApiResponse<{ profile: UserProfile }>) => {
                if (!response.success) {
                    throw new Error(response.error?.message || 'Failed to update profile');
                }
                return response.data.profile;
            },
            invalidatesTags: ["UserProfile", "Dashboard"],
        }),

        // Check username availability
        checkUsernameAvailability: builder.query<boolean, string>({
            query: (username) => `/profile/check-username?username=${encodeURIComponent(username)}`,
            transformResponse: (response: ApiResponse<{ available: boolean }>) => {
                if (!response.success) {
                    return false;
                }
                return response.data.available;
            },
        }),
    }),
});

export const {
    useFetchDashboardDataQuery,
    useFetchUserAnalyticsQuery,
    useFetchUserProficiencySignalsQuery,
    useFetchUserMetricProficiencyQuery,
    useFetchUserProfileQuery,
    useUpdateUserProfileMutation,
    useLazyCheckUsernameAvailabilityQuery,
} = dashboardApi;
