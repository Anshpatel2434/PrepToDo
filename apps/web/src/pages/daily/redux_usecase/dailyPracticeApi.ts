// dailyPracticeApi.ts
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../../services/apiClient";
import type { PracticeSession, QuestionAttempt, UUID, Question, Passage, Exam } from "../../../types";

interface TestDataState {
    examInfo: Exam;
    passages: Passage[];
    questions: Question[];
}

interface StartDailySessionQuery {
    user_id: UUID;
    paper_id: UUID;
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

export const dailyPracticeApi = createApi({
    reducerPath: "dailyPracticeApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["DailyPractice", "Session", "Attempts"],
    endpoints: (builder) => ({
        // Get today's daily practice data
        fetchDailyTestData: builder.query<TestDataState, void>({
            queryFn: async () => {
                console.log("-------------------IN FETCHING DAILY TEST DATA API-----------------");
                try {
                    // Step 1: Get current user
                    console.log("1. Checking if the user is logged in or not");
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log("User is not logged in !!");
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }
                    console.log("User is logged in");

                    // Step 2: Get the daily practice exam details from the table
                    console.log("2. Fetching the daily exam details");
                    const { data: examInfo, error: examInfoError } = await supabase
                        .from("exam_papers")
                        .select("*")
                        .eq("name", "Daily Practice")
                        .limit(1);

                    if (examInfoError) {
                        console.log("Error while fetching daily exam details");
                        console.log(examInfoError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: examInfoError.message,
                            },
                        };
                    }

                    console.log("The daily exam details response is:", examInfo);

                    // Step 3: Get the passage linked with the particular exam id
                    console.log("3. Fetching the daily exam passage");
                    const { data: passage, error: passageError } = await supabase
                        .from("passages")
                        .select("*")
                        .eq("paper_id", examInfo[0].id);

                    if (passageError) {
                        console.log("Error while fetching daily exam passages");
                        console.log(passageError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: passageError.message,
                            },
                        };
                    }

                    console.log("The daily exam passage response is:", passage);

                    // Step 4: Get the questions linked with the particular exam id
                    console.log("4. Fetching the daily exam questions");
                    const { data: questions, error: questionError } = await supabase
                        .from("questions")
                        .select("*")
                        .eq("paper_id", examInfo[0].id);

                    if (questionError) {
                        console.log("Error while fetching daily exam questions");
                        console.log(questionError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: questionError.message,
                            },
                        };
                    }

                    console.log("The daily exam question response is:", questions);

                    return {
                        data: {
                            examInfo: examInfo[0],
                            passages: passage,
                            questions: questions,
                        },
                    };
                } catch (error) {
                    console.log("In catch block of fetchDailyTestData");
                    console.log(error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error while fetching daily test data",
                        },
                    };
                }
            },
            providesTags: ["DailyPractice"],
        }),

        // Start the session for RC
        startDailyRCSession: builder.mutation<PracticeSession, StartDailySessionQuery>({
            queryFn: async ({ user_id, paper_id }) => {
                try {
                    // Step 1: Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log("User is not logged in !!");
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    const { data, error } = await supabase
                        .from("practice_sessions")
                        .insert([
                            {
                                user_id: user_id,
                                paper_id: paper_id,
                                session_type: "daily_challenge_rc",
                            },
                        ])
                        .select();

                    if (error) {
                        console.log("Error while creating daily RC session");
                        console.log(error);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    return { data: data[0] };
                } catch (error) {
                    console.log("In catch block of startDailyRCSession");
                    console.log(error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error while starting daily rc session",
                        },
                    };
                }
            },
            invalidatesTags: ["Session"],
        }),

        // Start the session for VA
        startDailyVASession: builder.mutation<PracticeSession, StartDailySessionQuery>({
            queryFn: async ({ user_id, paper_id }) => {
                try {
                    // Step 1: Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log("User is not logged in !!");
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    const { data, error } = await supabase
                        .from("practice_sessions")
                        .insert([
                            {
                                user_id: user_id,
                                paper_id: paper_id,
                                session_type: "daily_challenge_va",
                            },
                        ])
                        .select();

                    if (error) {
                        console.log("Error while creating daily VA session");
                        console.log(error);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    return { data: data[0] };
                } catch (error) {
                    console.log("In catch block of startDailyVASession");
                    console.log(error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error while starting daily va session",
                        },
                    };
                }
            },
            invalidatesTags: ["Session"],
        }),

        // Fetch existing session details (for resuming)
        fetchExistingSessionDetails: builder.query<
            { session: PracticeSession; attempts: QuestionAttempt[] },FetchExistingSessionQuery>({
            queryFn: async ({ user_id, paper_id, session_type }) => {
                try {
                    // Step 1: Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log("User is not logged in !!");
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    // Step 2: Fetch the most recent in-progress or paused session
                    const { data: sessionData, error: sessionError } = await supabase
                        .from("practice_sessions")
                        .select("*")
                        .eq("user_id", user_id)
                        .eq("paper_id", paper_id)
                        .eq("session_type", session_type)
                        .in("status", ["in_progress", "paused"])
                        .order("created_at", { ascending: false })
                        .limit(1);

                    if (sessionError) {
                        console.log("Error while fetching existing session");
                        console.log(sessionError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: sessionError.message,
                            },
                        };
                    }

                    if (!sessionData || sessionData.length === 0) {
                        return {
                            error: {
                                status: "NOT_FOUND",
                                data: "No existing session found",
                            },
                        };
                    }

                    const session = sessionData[0];

                    // Step 3: Fetch all attempts for this session
                    const { data: attemptsData, error: attemptsError } = await supabase
                        .from("question_attempts")
                        .select("*")
                        .eq("session_id", session.id);

                    if (attemptsError) {
                        console.log("Error while fetching question attempts");
                        console.log(attemptsError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: attemptsError.message,
                            },
                        };
                    }

                    return {
                        data: {
                            session: session,
                            attempts: attemptsData || [],
                        },
                    };
                } catch (error) {
                    console.log("In catch block of fetchExistingSessionDetails");
                    console.log(error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error while fetching existing session details",
                        },
                    };
                }
            },
            providesTags: ["Session", "Attempts"],
        }),

        // Save session details (update existing session)
        saveSessionDetails: builder.mutation<PracticeSession, SaveSessionDetailsQuery>({
            queryFn: async ({
                session_id,
                time_spent_seconds,
                completed_at,
                status,
                total_questions,
                correct_answers,
                score_percentage,
                current_question_index,
            }) => {
                try {
                    // Step 1: Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log("User is not logged in !!");
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    // Step 2: Update session
                    const updateData: any = {
                        time_spent_seconds,
                        status,
                        total_questions,
                        correct_answers,
                        score_percentage,
                        current_question_index,
                        updated_at: new Date().toISOString(),
                    };

                    if (completed_at) {
                        updateData.completed_at = completed_at;
                    }

                    const { data, error } = await supabase
                        .from("practice_sessions")
                        .update(updateData)
                        .eq("id", session_id)
                        .select();

                    if (error) {
                        console.log("Error while saving session details");
                        console.log(error);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    return { data: data[0] };
                } catch (error) {
                    console.log("In catch block of saveSessionDetails");
                    console.log(error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error while saving session details",
                        },
                    };
                }
            },
            invalidatesTags: ["Session"],
        }),

        // Save question attempts (batch upsert)
        saveQuestionAttempts: builder.mutation<QuestionAttempt[], SaveQuestionAttemptsQuery>({
            queryFn: async ({ attempts }) => {
                try {
                    // Step 1: Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log("User is not logged in !!");
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    // Step 2: Upsert attempts
                    const { data, error } = await supabase
                        .from("question_attempts")
                        .upsert(attempts, { onConflict: "user_id,session_id,question_id" })
                        .select();

                    if (error) {
                        console.log("Error while saving question attempts");
                        console.log(error);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    return { data: data || [] };
                } catch (error) {
                    console.log("In catch block of saveQuestionAttempts");
                    console.log(error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error while saving question attempts",
                        },
                    };
                }
            },
            invalidatesTags: ["Attempts"],
        }),
    }),
});

export const {
    useFetchDailyTestDataQuery,
    useLazyFetchDailyTestDataQuery,
    useStartDailyRCSessionMutation,
    useStartDailyVASessionMutation,
    useFetchExistingSessionDetailsQuery,
    useLazyFetchExistingSessionDetailsQuery,
    useSaveSessionDetailsMutation,
    useSaveQuestionAttemptsMutation,
} = dailyPracticeApi;