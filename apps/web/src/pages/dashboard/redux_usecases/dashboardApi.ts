import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../../services/apiClient";
import type {
    UserAnalytics,
    UserMetricProficiency,
    UserProfile,
    UserProficiencySignals,
    UUID,
} from "../../../types";

export const dashboardApi = createApi({
    reducerPath: "dashboardApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: [
        "Dashboard",
        "UserAnalytics",
        "UserMetricProficiency",
        "UserProficiencySignals",
        "UserProfile",
    ],
    endpoints: (builder) => ({
        fetchUserAnalytics: builder.query<UserAnalytics | null, UUID>({
            queryFn: async (userId) => {
                console.log("📊 [DashboardApi] fetchUserAnalytics", { userId });

                try {
                    const { data, error } = await supabase
                        .from("user_analytics")
                        .select("*")
                        .eq("user_id", userId)
                        .maybeSingle();

                    if (error) {
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    return { data: (data ?? null) as UserAnalytics | null };
                } catch (err) {
                    const e = err as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error fetching user analytics",
                        },
                    };
                }
            },
            providesTags: (_result, _error, userId) => [
                { type: "UserAnalytics", id: userId },
                "Dashboard",
            ],
        }),

        fetchUserProficiencySignals: builder.query<UserProficiencySignals | null, UUID>({
            queryFn: async (userId) => {
                console.log("🎯 [DashboardApi] fetchUserProficiencySignals", { userId });

                try {
                    const { data, error } = await supabase
                        .from("user_proficiency_signals")
                        .select("*")
                        .eq("user_id", userId)
                        .maybeSingle();

                    if (error) {
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    return { data: (data ?? null) as UserProficiencySignals | null };
                } catch (err) {
                    const e = err as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error fetching proficiency signals",
                        },
                    };
                }
            },
            providesTags: (_result, _error, userId) => [
                { type: "UserProficiencySignals", id: userId },
                "Dashboard",
            ],
        }),

        fetchUserMetricProficiency: builder.query<UserMetricProficiency[], UUID>({
            queryFn: async (userId) => {
                console.log("📈 [DashboardApi] fetchUserMetricProficiency", { userId });

                try {
                    const { data, error } = await supabase
                        .from("user_metric_proficiency")
                        .select("*")
                        .eq("user_id", userId)
                        .order("dimension_type", { ascending: true })
                        .order("dimension_key", { ascending: true });

                    if (error) {
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    return { data: (data ?? []) as UserMetricProficiency[] };
                } catch (err) {
                    const e = err as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error fetching metric proficiency",
                        },
                    };
                }
            },
            providesTags: (_result, _error, userId) => [
                { type: "UserMetricProficiency", id: userId },
                "Dashboard",
            ],
        }),

        fetchUserProfile: builder.query<UserProfile | null, UUID>({
            queryFn: async (userId) => {
                console.log("👤 [DashboardApi] fetchUserProfile", { userId });

                try {
                    const { data, error } = await supabase
                        .from("user_profiles")
                        .select(
                            "id, username, display_name, avatar_url, subscription_tier, preferred_difficulty, theme, daily_goal_minutes, show_on_leaderboard, created_at, updated_at"
                        )
                        .eq("id", userId)
                        .maybeSingle();

                    if (error) {
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    return { data: (data ?? null) as UserProfile | null };
                } catch (err) {
                    const e = err as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error fetching user profile",
                        },
                    };
                }
            },
            providesTags: (_result, _error, userId) => [
                { type: "UserProfile", id: userId },
                "Dashboard",
            ],
        }),
    }),
});

export const {
    useFetchUserAnalyticsQuery,
    useFetchUserProficiencySignalsQuery,
    useFetchUserMetricProficiencyQuery,
    useFetchUserProfileQuery,
} = dashboardApi;
