// dashboardApi.ts
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../../services/apiClient";
import type {
    UserProfile,
    UserAnalytics,
    UserProficiencySignals,
    UserMetricProficiency,
    PracticeSession,
} from "../../../types";

// Query interfaces
interface FetchUserProfileQuery {
    user_id?: string;
}

interface FetchUserAnalyticsQuery {
    user_id: string;
    days?: number;
}

interface FetchUserProficiencyQuery {
    user_id: string;
    dimension_type?: UserMetricProficiency["dimension_type"];
}

interface FetchPracticeSessionsQuery {
    user_id: string;
    limit?: number;
}

export const dashboardApi = createApi({
    reducerPath: "dashboardApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Dashboard", "UserProfile", "UserAnalytics", "Proficiency", "Sessions"],
    endpoints: (builder) => ({
        // Fetch user profile
        fetchUserProfile: builder.query<UserProfile, FetchUserProfileQuery>({
            queryFn: async ({ user_id }) => {
                try {
                    console.log("[DashboardApi] fetchUserProfile called");
                    
                    // Get user_id from auth if not provided
                    let targetUserId = user_id;
                    if (!targetUserId) {
                        const { data: { user }, error: userError } = await supabase.auth.getUser();
                        if (userError || !user) {
                            return { error: { status: "UNAUTHORIZED", data: "User not authenticated" } };
                        }
                        targetUserId = user.id;
                    }

                    const { data, error } = await supabase
                        .from("user_profiles")
                        .select("*")
                        .eq("id", targetUserId)
                        .single();

                    if (error) {
                        console.log("[DashboardApi] Error fetching user profile:", error);
                        return { error: { status: "CUSTOM_ERROR", data: error.message } };
                    }

                    console.log("[DashboardApi] User profile fetched successfully");
                    return { data };
                } catch (error) {
                    console.log("[DashboardApi] Error in fetchUserProfile:", error);
                    const e = error as { message?: string };
                    return { error: { status: "CUSTOM_ERROR", data: e.message || "Error fetching user profile" } };
                }
            },
            providesTags: ["UserProfile"],
        }),

        // Fetch user analytics (historical data)
        fetchUserAnalytics: builder.query<UserAnalytics[], FetchUserAnalyticsQuery>({
            queryFn: async ({ user_id, days = 84 }) => {
                try {
                    console.log("[DashboardApi] fetchUserAnalytics called for user:", user_id);
                    
                    const { data, error } = await supabase
                        .from("user_analytics")
                        .select("*")
                        .eq("user_id", user_id)
                        .order("date", { ascending: false })
                        .limit(days);

                    if (error) {
                        console.log("[DashboardApi] Error fetching user analytics:", error);
                        return { error: { status: "CUSTOM_ERROR", data: error.message } };
                    }

                    console.log("[DashboardApi] Fetched", data?.length || 0, "analytics records");
                    return { data: data || [] };
                } catch (error) {
                    console.log("[DashboardApi] Error in fetchUserAnalytics:", error);
                    const e = error as { message?: string };
                    return { error: { status: "CUSTOM_ERROR", data: e.message || "Error fetching analytics" } };
                }
            },
            providesTags: ["UserAnalytics"],
        }),

        // Fetch user proficiency signals (aggregated insights)
        fetchUserProficiencySignals: builder.query<UserProficiencySignals | null, { user_id: string }>({
            queryFn: async ({ user_id }) => {
                try {
                    console.log("[DashboardApi] fetchUserProficiencySignals called for user:", user_id);
                    
                    const { data, error } = await supabase
                        .from("user_proficiency_signals")
                        .select("*")
                        .eq("user_id", user_id)
                        .single();

                    if (error) {
                        if (error.code === "PGRST116") {
                            // No records found, return null
                            console.log("[DashboardApi] No proficiency signals found for user");
                            return { data: null };
                        }
                        console.log("[DashboardApi] Error fetching proficiency signals:", error);
                        return { error: { status: "CUSTOM_ERROR", data: error.message } };
                    }

                    console.log("[DashboardApi] Proficiency signals fetched successfully");
                    return { data };
                } catch (error) {
                    console.log("[DashboardApi] Error in fetchUserProficiencySignals:", error);
                    const e = error as { message?: string };
                    return { error: { status: "CUSTOM_ERROR", data: e.message || "Error fetching proficiency signals" } };
                }
            },
            providesTags: ["Proficiency"],
        }),

        // Fetch user metric proficiency (granular skill levels)
        fetchUserMetricProficiency: builder.query<UserMetricProficiency[], FetchUserProficiencyQuery>({
            queryFn: async ({ user_id, dimension_type }) => {
                try {
                    console.log("[DashboardApi] fetchUserMetricProficiency called for user:", user_id);
                    
                    let query = supabase
                        .from("user_metric_proficiency")
                        .select("*")
                        .eq("user_id", user_id)
                        .order("dimension_type", { ascending: true })
                        .order("proficiency_score", { ascending: false });

                    if (dimension_type) {
                        query = query.eq("dimension_type", dimension_type);
                    }

                    const { data, error } = await query;

                    if (error) {
                        console.log("[DashboardApi] Error fetching metric proficiency:", error);
                        return { error: { status: "CUSTOM_ERROR", data: error.message } };
                    }

                    console.log("[DashboardApi] Fetched", data?.length || 0, "metric proficiency records");
                    return { data: data || [] };
                } catch (error) {
                    console.log("[DashboardApi] Error in fetchUserMetricProficiency:", error);
                    const e = error as { message?: string };
                    return { error: { status: "CUSTOM_ERROR", data: e.message || "Error fetching metric proficiency" } };
                }
            },
            providesTags: (_result, _error, { dimension_type }) => {
                return dimension_type 
                    ? [{ type: "Proficiency", id: `DIMENSION_${dimension_type}` }]
                    : ["Proficiency"];
            },
        }),

        // Fetch practice sessions
        fetchPracticeSessions: builder.query<PracticeSession[], FetchPracticeSessionsQuery>({
            queryFn: async ({ user_id, limit = 10 }) => {
                try {
                    console.log("[DashboardApi] fetchPracticeSessions called for user:", user_id);
                    
                    const { data, error } = await supabase
                        .from("practice_sessions")
                        .select("*")
                        .eq("user_id", user_id)
                        .eq("status", "completed")
                        .order("completed_at", { ascending: false })
                        .limit(limit);

                    if (error) {
                        console.log("[DashboardApi] Error fetching practice sessions:", error);
                        return { error: { status: "CUSTOM_ERROR", data: error.message } };
                    }

                    console.log("[DashboardApi] Fetched", data?.length || 0, "practice sessions");
                    return { data: data || [] };
                } catch (error) {
                    console.log("[DashboardApi] Error in fetchPracticeSessions:", error);
                    const e = error as { message?: string };
                    return { error: { status: "CUSTOM_ERROR", data: e.message || "Error fetching practice sessions" } };
                }
            },
            providesTags: ["Sessions"],
        }),

        // Fetch genre proficiency (subset of metric proficiency)
        fetchGenreProficiency: builder.query<UserMetricProficiency[], { user_id: string }>({
            queryFn: async ({ user_id }) => {
                try {
                    console.log("[DashboardApi] fetchGenreProficiency called for user:", user_id);
                    
                    const { data, error } = await supabase
                        .from("user_metric_proficiency")
                        .select("*")
                        .eq("user_id", user_id)
                        .eq("dimension_type", "genre")
                        .order("proficiency_score", { ascending: false });

                    if (error) {
                        console.log("[DashboardApi] Error fetching genre proficiency:", error);
                        return { error: { status: "CUSTOM_ERROR", data: error.message } };
                    }

                    console.log("[DashboardApi] Fetched", data?.length || 0, "genre proficiency records");
                    return { data: data || [] };
                } catch (error) {
                    console.log("[DashboardApi] Error in fetchGenreProficiency:", error);
                    const e = error as { message?: string };
                    return { error: { status: "CUSTOM_ERROR", data: e.message || "Error fetching genre proficiency" } };
                }
            },
            providesTags: [{ type: "Proficiency", id: "DIMENSION_genre" }],
        }),

        // Fetch core skill metrics (subset of metric proficiency)
        fetchCoreSkillMetrics: builder.query<UserMetricProficiency[], { user_id: string }>({
            queryFn: async ({ user_id }) => {
                try {
                    console.log("[DashboardApi] fetchCoreSkillMetrics called for user:", user_id);
                    
                    const { data, error } = await supabase
                        .from("user_metric_proficiency")
                        .select("*")
                        .eq("user_id", user_id)
                        .eq("dimension_type", "core_metric")
                        .order("proficiency_score", { ascending: false });

                    if (error) {
                        console.log("[DashboardApi] Error fetching core skill metrics:", error);
                        return { error: { status: "CUSTOM_ERROR", data: error.message } };
                    }

                    console.log("[DashboardApi] Fetched", data?.length || 0, "core skill metrics");
                    return { data: data || [] };
                } catch (error) {
                    console.log("[DashboardApi] Error in fetchCoreSkillMetrics:", error);
                    const e = error as { message?: string };
                    return { error: { status: "CUSTOM_ERROR", data: e.message || "Error fetching core skill metrics" } };
                }
            },
            providesTags: [{ type: "Proficiency", id: "DIMENSION_core_metric" }],
        }),

        // Fetch error pattern trends (subset of metric proficiency)
        fetchErrorPatternTrends: builder.query<UserMetricProficiency[], { user_id: string }>({
            queryFn: async ({ user_id }) => {
                try {
                    console.log("[DashboardApi] fetchErrorPatternTrends called for user:", user_id);
                    
                    const { data, error } = await supabase
                        .from("user_metric_proficiency")
                        .select("*")
                        .eq("user_id", user_id)
                        .eq("dimension_type", "error_pattern")
                        .order("proficiency_score", { ascending: true })
                        .limit(10);

                    if (error) {
                        console.log("[DashboardApi] Error fetching error pattern trends:", error);
                        return { error: { status: "CUSTOM_ERROR", data: error.message } };
                    }

                    console.log("[DashboardApi] Fetched", data?.length || 0, "error pattern records");
                    return { data: data || [] };
                } catch (error) {
                    console.log("[DashboardApi] Error in fetchErrorPatternTrends:", error);
                    const e = error as { message?: string };
                    return { error: { status: "CUSTOM_ERROR", data: e.message || "Error fetching error patterns" } };
                }
            },
            providesTags: [{ type: "Proficiency", id: "DIMENSION_error_pattern" }],
        }),
    }),
});

export const {
    useFetchUserProfileQuery,
    useLazyFetchUserProfileQuery,
    useFetchUserAnalyticsQuery,
    useLazyFetchUserAnalyticsQuery,
    useFetchUserProficiencySignalsQuery,
    useLazyFetchUserProficiencySignalsQuery,
    useFetchUserMetricProficiencyQuery,
    useLazyFetchUserMetricProficiencyQuery,
    useFetchPracticeSessionsQuery,
    useLazyFetchPracticeSessionsQuery,
    useFetchGenreProficiencyQuery,
    useLazyFetchGenreProficiencyQuery,
    useFetchCoreSkillMetricsQuery,
    useLazyFetchCoreSkillMetricsQuery,
    useFetchErrorPatternTrendsQuery,
    useLazyFetchErrorPatternTrendsQuery,
} = dashboardApi;
