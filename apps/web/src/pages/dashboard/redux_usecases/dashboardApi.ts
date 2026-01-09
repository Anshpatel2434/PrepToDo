import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../../services/apiClient";
import type { 
    UserAnalytics, 
    UserMetricProficiency, 
    UserProficiencySignals,
    UUID 
} from "../../../types";

export const dashboardApi = createApi({
    reducerPath: "dashboardApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["UserAnalytics", "UserProficiency", "UserSignals", "Sessions"],
    endpoints: (builder) => ({
        fetchUserAnalytics: builder.query<UserAnalytics[], UUID>({
            queryFn: async (userId) => {
                try {
                    const { data, error } = await supabase
                        .from("user_analytics")
                        .select("*")
                        .eq("user_id", userId)
                        .order("date", { ascending: false })
                        .limit(90);

                    if (error) throw error;
                    return { data: data || [] };
                } catch (error: any) {
                    return { error: { status: "CUSTOM_ERROR", data: error.message } };
                }
            },
            providesTags: ["UserAnalytics"],
        }),

        fetchUserProficiency: builder.query<UserMetricProficiency[], UUID>({
            queryFn: async (userId) => {
                try {
                    const { data, error } = await supabase
                        .from("user_metric_proficiency")
                        .select("*")
                        .eq("user_id", userId);

                    if (error) throw error;
                    return { data: data || [] };
                } catch (error: any) {
                    return { error: { status: "CUSTOM_ERROR", data: error.message } };
                }
            },
            providesTags: ["UserProficiency"],
        }),

        fetchUserSignals: builder.query<UserProficiencySignals, UUID>({
            queryFn: async (userId) => {
                try {
                    const { data, error } = await supabase
                        .from("user_proficiency_signals")
                        .select("*")
                        .eq("user_id", userId)
                        .maybeSingle();

                    if (error) throw error;
                    return { data };
                } catch (error: any) {
                    return { error: { status: "CUSTOM_ERROR", data: error.message } };
                }
            },
            providesTags: ["UserSignals"],
        }),

        fetchRecentSessions: builder.query<any[], UUID>({
            queryFn: async (userId) => {
                try {
                    const { data, error } = await supabase
                        .from("practice_sessions")
                        .select(`
                            *,
                            question_attempts (
                                is_correct,
                                time_spent_seconds,
                                passage_id
                            )
                        `)
                        .eq("user_id", userId)
                        .eq("status", "completed")
                        .order("completed_at", { ascending: false })
                        .limit(20);

                    if (error) throw error;

                    // Get unique passage IDs from all attempts in these sessions
                    const passageIds = Array.from(new Set(
                        data?.flatMap(s => s.question_attempts?.map((a: any) => a.passage_id).filter(Boolean)) || []
                    ));

                    let wordCounts: Record<string, number> = {};
                    if (passageIds.length > 0) {
                        const { data: passages, error: pError } = await supabase
                            .from("passages")
                            .select("id, word_count")
                            .in("id", passageIds);
                        
                        if (!pError && passages) {
                            wordCounts = passages.reduce((acc: any, p: any) => {
                                acc[p.id] = p.word_count;
                                return acc;
                            }, {});
                        }
                    }

                    // Attach word counts and calculate WPM per session
                    const enrichedSessions = data?.map(s => {
                        const totalWords = s.question_attempts?.reduce((acc: number, a: any) => {
                            return acc + (wordCounts[a.passage_id] || 0) / (s.question_attempts.length || 1); // Approximation if multiple questions per passage
                        }, 0) || 0;
                        
                        // Better approximation: sum of unique passage word counts in that session
                        const sessionPassageIds = new Set(s.question_attempts?.map((a: any) => a.passage_id).filter(Boolean));
                        const sessionTotalWords = Array.from(sessionPassageIds).reduce((acc: number, id: any) => acc + (wordCounts[id] || 0), 0);

                        const wpm = s.time_spent_seconds > 0 ? Math.round(sessionTotalWords / (s.time_spent_seconds / 60)) : 0;
                        const accuracy = s.total_questions > 0 ? Math.round((s.correct_answers / s.total_questions) * 100) : 0;

                        return { ...s, wpm, accuracy };
                    });

                    return { data: enrichedSessions || [] };
                } catch (error: any) {
                    return { error: { status: "CUSTOM_ERROR", data: error.message } };
                }
            },
            providesTags: ["Sessions"],
        }),
    }),
});

export const {
    useFetchUserAnalyticsQuery,
    useFetchUserProficiencyQuery,
    useFetchUserSignalsQuery,
    useFetchRecentSessionsQuery,
} = dashboardApi;
