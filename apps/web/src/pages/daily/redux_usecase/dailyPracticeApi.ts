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

export const dailyPracticeApi = createApi({
    reducerPath: "dailyPracticeApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["DailyPractice", "Session", "Attempts"],
    endpoints: (builder) => ({
        // Get today's daily practice data
        fetchDailyTestData: builder.query<TestDataState, void>({
            queryFn: async () => {
                console.log('[DailyPracticeApi] fetchDailyTestData called');
                try {
                    // Step 1: Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log('[DailyPracticeApi] User is not authenticated');
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] User authenticated:', user.id);

                    // Step 2: Get today's daily practice exam for 2026 (filter by today's date)
                    const today = new Date().toISOString().split('T')[0];
                    const startOfToday = `${today}T00:00:00.000Z`;
                    const endOfToday = `${today}T23:59:59.999Z`;
                    console.log('[DailyPracticeApi] Fetching exam for date:', today);

                    const { data: examInfo, error: examInfoError } = await supabase
                        .from("exam_papers")
                        .select("*")
                        .eq("year", 2026)
                        .gte("created_at", startOfToday)
                        .lte("created_at", endOfToday)
                        .order("created_at", { ascending: false })
                        .limit(1)

                    if (examInfoError) {
                        console.log('[DailyPracticeApi] Error while fetching daily exam details:', examInfoError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: examInfoError.message,
                            },
                        };
                    }

                    // Check if there's an exam for today
                    if (!examInfo || examInfo.length === 0) {
                        console.log('[DailyPracticeApi] No exam found for today');
                        return {
                            data: {
                                examInfo: null,
                                passages: [],
                                questions: [],
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] Fetched exam info:', examInfo[0].id);

                    // Step 3: Get the passage linked with the particular exam id
                    const { data: passage, error: passageError } = await supabase
                        .from("passages")
                        .select("*")
                        .eq("paper_id", examInfo[0].id);

                    if (passageError) {
                        console.log('[DailyPracticeApi] Error while fetching daily exam passages:', passageError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: passageError.message,
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] Fetched', passage.length, 'passages');

                    // Step 4: Get the questions linked with the particular exam id
                    const { data: questions, error: questionError } = await supabase
                        .from("questions")
                        .select("*")
                        .eq("paper_id", examInfo[0].id);

                    if (questionError) {
                        console.log('[DailyPracticeApi] Error while fetching daily exam questions:', questionError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: questionError.message,
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] Fetched', questions.length, 'questions');

                    console.log(questions)

                    return {
                        data: {
                            examInfo: examInfo[0],
                            passages: passage,
                            questions: questions,
                        },
                    };
                } catch (error) {
                    console.log('[DailyPracticeApi] Error in fetchDailyTestData:', error);
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

        // Get previous daily practice tests with pagination
        fetchPreviousDailyTests: builder.query<Exam[], { page?: number; limit?: number }>({
            queryFn: async ({ page = 1, limit = 20 }) => {
                console.log('[DailyPracticeApi] fetchPreviousDailyTests called with page:', page, 'limit:', limit);
                try {
                    // Step 1: Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log('[DailyPracticeApi] User is not authenticated');
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] User authenticated:', user.id);

                    // Calculate range for pagination (skip the first (latest) exam and start from index 1)
                    const offset = (page - 1) * limit;
                    const from = offset + 1; // +1 to skip the latest exam
                    const to = from + limit - 1;

                    // Step 2: Get previous daily practice exams with pagination
                    const { data: examInfo, error: examInfoError } = await supabase
                        .from("exam_papers")
                        .select("*")
                        .eq("year", 2026)
                        .order("created_at", { ascending: false }) // Sorts by newest first
                        .range(from, to)

                    if (examInfoError) {
                        console.log('[DailyPracticeApi] Error while fetching previous daily exams:', examInfoError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: examInfoError.message,
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] Fetched', examInfo?.length || 0, 'previous exams for page', page);

                    return {
                        data: examInfo || [],
                    };
                } catch (error) {
                    console.log('[DailyPracticeApi] Error in fetchPreviousDailyTests:', error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error while fetching previous daily tests",
                        },
                    };
                }
            },
            providesTags: ["DailyPractice"],
        }),

        // Get specific daily test by exam_id
        fetchDailyTestById: builder.query<TestDataState, { exam_id: UUID }>({
            queryFn: async ({ exam_id }) => {
                console.log('[DailyPracticeApi] fetchDailyTestById called for exam_id:', exam_id);
                try {
                    // Step 1: Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log('[DailyPracticeApi] User is not authenticated');
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] User authenticated:', user.id);

                    // Step 2: Get the specific daily practice exam
                    const { data: examInfo, error: examInfoError } = await supabase
                        .from("exam_papers")
                        .select("*")
                        .eq("id", exam_id)
                        .single();

                    if (examInfoError) {
                        console.log('[DailyPracticeApi] Error while fetching daily exam details:', examInfoError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: examInfoError.message,
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] Fetched exam info:', examInfo.id);

                    // Step 3: Get the passage linked with the particular exam id
                    const { data: passage, error: passageError } = await supabase
                        .from("passages")
                        .select("*")
                        .eq("paper_id", examInfo.id);

                    if (passageError) {
                        console.log('[DailyPracticeApi] Error while fetching daily exam passages:', passageError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: passageError.message,
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] Fetched', passage.length, 'passages');

                    // Step 4: Get the questions linked with the particular exam id
                    const { data: questions, error: questionError } = await supabase
                        .from("questions")
                        .select("*")
                        .eq("paper_id", examInfo.id);

                    if (questionError) {
                        console.log('[DailyPracticeApi] Error while fetching daily exam questions:', questionError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: questionError.message,
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] Fetched', questions.length, 'questions');

                    return {
                        data: {
                            examInfo: examInfo,
                            passages: passage,
                            questions: questions,
                        },
                    };
                } catch (error) {
                    console.log('[DailyPracticeApi] Error in fetchDailyTestById:', error);
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
            queryFn: async ({ user_id, paper_id, passage_ids, question_ids }) => {
                console.log('[DailyPracticeApi] startDailyRCSession called for user:', user_id);
                try {
                    // Step 1: Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log('[DailyPracticeApi] User is not authenticated');
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
                                passage_ids: passage_ids && passage_ids.length > 0 ? passage_ids : null,
                                question_ids: question_ids && question_ids.length > 0 ? question_ids : null,
                            },
                        ])
                        .select();

                    if (error) {
                        console.log('[DailyPracticeApi] Error while creating daily RC session:', error);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] RC session created:', data[0].id);
                    return { data: data[0] };
                } catch (error) {
                    console.log('[DailyPracticeApi] Error in startDailyRCSession:', error);
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
            queryFn: async ({ user_id, paper_id, passage_ids, question_ids }) => {
                console.log('[DailyPracticeApi] startDailyVASession called for user:', user_id);
                try {
                    // Step 1: Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log('[DailyPracticeApi] User is not authenticated');
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
                                passage_ids: passage_ids && passage_ids.length > 0 ? passage_ids : null,
                                question_ids: question_ids && question_ids.length > 0 ? question_ids : null,
                            },
                        ])
                        .select();

                    if (error) {
                        console.log('[DailyPracticeApi] Error while creating daily VA session:', error);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] VA session created:', data[0].id);
                    return { data: data[0] };
                } catch (error) {
                    console.log('[DailyPracticeApi] Error in startDailyVASession:', error);
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
            { session: PracticeSession; attempts: QuestionAttempt[] }, FetchExistingSessionQuery>({
                queryFn: async ({ user_id, paper_id, session_type }) => {
                    console.log('[DailyPracticeApi] fetchExistingSessionDetails called for session type:', session_type);
                    try {
                        // Step 1: Get current user
                        const { data: { user }, error: userError } = await supabase.auth.getUser();

                        if (userError || !user) {
                            console.log('[DailyPracticeApi] User is not authenticated');
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
                            .order("created_at", { ascending: false })
                            .limit(1);

                        if (sessionError) {
                            console.log('[DailyPracticeApi] Error while fetching existing session:', sessionError);
                            return {
                                error: {
                                    status: "CUSTOM_ERROR",
                                    data: sessionError.message,
                                },
                            };
                        }

                        if (!sessionData || sessionData.length === 0) {
                            console.log('[DailyPracticeApi] No existing session found');
                            return {
                                error: {
                                    status: "NOT_FOUND",
                                    data: "No existing session found",
                                },
                            };
                        }

                        const session = sessionData[0];
                        console.log('[DailyPracticeApi] Found existing session:', session.id);

                        // Step 3: Fetch all attempts for this session
                        const { data: attemptsData, error: attemptsError } = await supabase
                            .from("question_attempts")
                            .select("*")
                            .eq("session_id", session.id);

                        if (attemptsError) {
                            console.log('[DailyPracticeApi] Error while fetching question attempts:', attemptsError);
                            return {
                                error: {
                                    status: "CUSTOM_ERROR",
                                    data: attemptsError.message,
                                },
                            };
                        }

                        console.log('[DailyPracticeApi] Fetched', attemptsData?.length || 0, 'existing attempts');
                        return {
                            data: {
                                session: session,
                                attempts: attemptsData || [],
                            },
                        };
                    } catch (error) {
                        console.log('[DailyPracticeApi] Error in fetchExistingSessionDetails:', error);
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
                console.log('[DailyPracticeApi] saveSessionDetails called for session:', session_id);
                console.log('[DailyPracticeApi] Session status:', status, 'Time spent:', time_spent_seconds, 'Score:', score_percentage);
                try {
                    // Step 1: Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log('[DailyPracticeApi] User is not authenticated');
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    // Step 2: Update session
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                        console.log('[DailyPracticeApi] Error while saving session details:', error);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] Session details saved successfully');
                    return { data: data[0] };
                } catch (error) {
                    console.log('[DailyPracticeApi] Error in saveSessionDetails:', error);
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
                console.log('[DailyPracticeApi] saveQuestionAttempts called with', attempts.length, 'attempts');
                console.log("this is the data : ")
                console.log(attempts)
                try {
                    // Step 1: Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log('[DailyPracticeApi] User is not authenticated');
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
                        .upsert(attempts, { onConflict: "user_id, session_id, question_id" })
                        .select();

                    if (error) {
                        console.log('[DailyPracticeApi] Error while saving question attempts:', error);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] Question attempts saved successfully');
                    return { data: data || [] };
                } catch (error) {
                    console.log('[DailyPracticeApi] Error in saveQuestionAttempts:', error);
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
    useFetchPreviousDailyTestsQuery,
    useLazyFetchPreviousDailyTestsQuery,
    useFetchDailyTestByIdQuery,
    useLazyFetchDailyTestByIdQuery,
    useStartDailyRCSessionMutation,
    useStartDailyVASessionMutation,
    useFetchExistingSessionDetailsQuery,
    useLazyFetchExistingSessionDetailsQuery,
    useSaveSessionDetailsMutation,
    useSaveQuestionAttemptsMutation,
} = dailyPracticeApi;