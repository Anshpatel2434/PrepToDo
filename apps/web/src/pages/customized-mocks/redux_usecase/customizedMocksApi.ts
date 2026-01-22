// customizedMocksApi.ts
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../../services/apiClient";
import type { Exam, PracticeSession, UUID, Question, Passage, QuestionAttempt, UserMetricProficiency, Genre } from "../../../types";

interface CustomizedMockRequest {
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
        genre_performance?: any;
        question_type_performance?: any;
        weak_topics?: string[];
        weak_question_types?: string[];
    };
}

export interface CustomizedMockWithSession extends Exam {
    session_status: "not_started" | "in_progress" | "completed" | null;
    session_id?: UUID;
    passages_count?: number;
    questions_count?: number;
}

interface CreateMockResponse {
    success: boolean;
    exam_id?: UUID;
    message: string;
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

interface StartMockSessionQuery {
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

interface FetchExistingMockSessionQuery {
    user_id: UUID;
    paper_id: UUID;
}

export const customizedMocksApi = createApi({
    reducerPath: "customizedMocksApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["CustomizedMocks", "MockSessions", "UserMetricProficiency"],
    endpoints: (builder) => ({
        // Fetch user metric proficiency for recommendations
        fetchUserMetricProficiency: builder.query<UserMetricProficiency[], UUID>({
            queryFn: async (userId) => {
                console.log("📈 [CustomizedMocksApi] fetchUserMetricProficiency", { userId });

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
            ],
        }),

        // Fetch all available genres from the database
        fetchAvailableGenres: builder.query<Genre[], void>({
            queryFn: async () => {
                console.log("🎭 [CustomizedMocksApi] fetchAvailableGenres");
                try {
                    const { data, error } = await supabase
                        .from("genres")
                        .select("*")
                        .eq("is_active", true)
                        .order("name", { ascending: true });

                    if (error) {
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    return { data: (data ?? []) as Genre[] };
                } catch (err) {
                    const e = err as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error fetching available genres",
                        },
                    };
                }
            },
        }),

        // Fetch all customized mocks created by the current user
        fetchCustomizedMocks: builder.query<CustomizedMockWithSession[], void>({
            queryFn: async () => {
                console.log("[CustomizedMocksApi] fetchCustomizedMocks called");
                try {
                    // Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log("[CustomizedMocksApi] User is not authenticated");
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    console.log("[CustomizedMocksApi] User authenticated:", user.id);

                    // Fetch all exams created by this user
                    const { data: exams, error: examsError } = await supabase
                        .from("exam_papers")
                        .select("*")
                        .eq("generated_by_user_id", user.id)
                        .order("created_at", { ascending: false });

                    if (examsError) {
                        console.log("[CustomizedMocksApi] Error fetching exams:", examsError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: examsError.message,
                            },
                        };
                    }

                    console.log(`[CustomizedMocksApi] Fetched ${exams?.length || 0} exams`);

                    if (!exams || exams.length === 0) {
                        return { data: [] };
                    }

                    // Fetch session status for each exam
                    const examIds = exams.map(exam => exam.id);
                    const { data: sessions, error: sessionsError } = await supabase
                        .from("practice_sessions")
                        .select("*")
                        .eq("user_id", user.id)
                        .in("paper_id", examIds);

                    if (sessionsError) {
                        console.log("[CustomizedMocksApi] Error fetching sessions:", sessionsError);
                        // Continue without session data rather than failing
                    }

                    // Fetch passage and question counts for each exam
                    const { data: passages, error: passagesError } = await supabase
                        .from("passages")
                        .select("id, paper_id")
                        .in("paper_id", examIds);

                    const { data: questions, error: questionsError } = await supabase
                        .from("questions")
                        .select("id, paper_id")
                        .in("paper_id", examIds);

                    if (passagesError) {
                        console.log("[CustomizedMocksApi] Error fetching passages:", passagesError);
                    }

                    if (questionsError) {
                        console.log("[CustomizedMocksApi] Error fetching questions:", questionsError);
                    }

                    // Map exams with session status and counts
                    const examsWithStatus: CustomizedMockWithSession[] = exams.map(exam => {
                        const examSessions = sessions?.filter(s => s.paper_id === exam.id) || [];
                        const latestSession = examSessions.sort((a, b) =>
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        )[0];

                        let sessionStatus: "not_started" | "in_progress" | "completed" | null = null;
                        if (latestSession) {
                            if (latestSession.status === "completed") {
                                sessionStatus = "completed";
                            } else if (latestSession.status === "in_progress" || latestSession.status === "paused") {
                                sessionStatus = "in_progress";
                            }
                        } else {
                            sessionStatus = "not_started";
                        }

                        const passagesCount = passages?.filter(p => p.paper_id === exam.id).length || 0;
                        const questionsCount = questions?.filter(q => q.paper_id === exam.id).length || 0;

                        return {
                            ...exam,
                            session_status: sessionStatus,
                            session_id: latestSession?.id,
                            passages_count: passagesCount,
                            questions_count: questionsCount,
                        };
                    });

                    console.log(`[CustomizedMocksApi] Returning ${examsWithStatus.length} exams with session status`);
                    return { data: examsWithStatus };
                } catch (error) {
                    console.log("[CustomizedMocksApi] Error in fetchCustomizedMocks:", error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error fetching customized mocks",
                        },
                    };
                }
            },
            providesTags: ["CustomizedMocks"],
        }),

        // Create a new customized mock by calling the edge function
        createCustomizedMock: builder.mutation<CreateMockResponse, CustomizedMockRequest>({
            queryFn: async (params) => {
                console.log("[CustomizedMocksApi] createCustomizedMock called");
                console.log("[CustomizedMocksApi] Parameters:", params);
                try {
                    // Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log("[CustomizedMocksApi] User is not authenticated");
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    console.log("[CustomizedMocksApi] Calling edge function: customized-mocks");

                    // Call the customized-mocks edge function
                    const { data, error } = await supabase.functions.invoke("customized-mocks", {
                        body: params
                    });

                    if (error) {
                        console.log("[CustomizedMocksApi] Edge function error:", error);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }


                    console.log("[CustomizedMocksApi] Edge function response:", data);

                    return { data: data };
                } catch (error) {
                    console.log("[CustomizedMocksApi] Error in createCustomizedMock:", error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error creating customized mock",
                        },
                    };
                }
            },
            invalidatesTags: ["CustomizedMocks"],
        }),

        // Check if user has an existing session for a mock
        checkExistingSession: builder.query<CheckSessionResponse, { paper_id: UUID }>({
            queryFn: async ({ paper_id }) => {
                console.log("[CustomizedMocksApi] checkExistingSession called for paper:", paper_id);
                try {
                    // Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log("[CustomizedMocksApi] User is not authenticated");
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    // Fetch sessions for this exam and user
                    const { data: sessions, error: sessionsError } = await supabase
                        .from("practice_sessions")
                        .select("*")
                        .eq("user_id", user.id)
                        .eq("paper_id", paper_id)
                        .order("created_at", { ascending: false });

                    if (sessionsError) {
                        console.log("[CustomizedMocksApi] Error fetching session:", sessionsError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: sessionsError.message,
                            },
                        };
                    }

                    if (!sessions || sessions.length === 0) {
                        console.log("[CustomizedMocksApi] No session found");
                        return {
                            data: {
                                has_session: false,
                                status: "not_started",
                            },
                        };
                    }

                    const latestSession = sessions[0];
                    let status: "not_started" | "in_progress" | "completed" | null = null;

                    if (latestSession.status === "completed") {
                        status = "completed";
                    } else if (latestSession.status === "in_progress" || latestSession.status === "paused") {
                        status = "in_progress";
                    } else {
                        status = "not_started";
                    }

                    console.log(`[CustomizedMocksApi] Found session with status: ${status}`);
                    return {
                        data: {
                            has_session: true,
                            session: latestSession,
                            status: status,
                        },
                    };
                } catch (error) {
                    console.log("[CustomizedMocksApi] Error in checkExistingSession:", error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error checking session",
                        },
                    };
                }
            },
            providesTags: ["MockSessions"],
        }),

        // Fetch mock test data by exam ID
        fetchMockTestById: builder.query<TestDataState, { exam_id: UUID }>({
            queryFn: async ({ exam_id }) => {
                console.log("[CustomizedMocksApi] fetchMockTestById called for exam_id:", exam_id);
                try {
                    // Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log("[CustomizedMocksApi] User is not authenticated");
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    console.log("[CustomizedMocksApi] User authenticated:", user.id);

                    // Fetch the specific exam
                    const { data: examInfo, error: examInfoError } = await supabase
                        .from("exam_papers")
                        .select("*")
                        .eq("id", exam_id)
                        .single();

                    if (examInfoError) {
                        console.log("[CustomizedMocksApi] Error while fetching exam details:", examInfoError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: examInfoError.message,
                            },
                        };
                    }

                    console.log("[CustomizedMocksApi] Fetched exam info:", examInfo.id);

                    // Fetch passages for this exam
                    const { data: passages, error: passageError } = await supabase
                        .from("passages")
                        .select("*")
                        .eq("paper_id", examInfo.id);

                    if (passageError) {
                        console.log("[CustomizedMocksApi] Error while fetching passages:", passageError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: passageError.message,
                            },
                        };
                    }

                    console.log("[CustomizedMocksApi] Fetched", passages?.length || 0, "passages");

                    // Fetch questions for this exam
                    const { data: questions, error: questionError } = await supabase
                        .from("questions")
                        .select("*")
                        .eq("paper_id", examInfo.id);

                    if (questionError) {
                        console.log("[CustomizedMocksApi] Error while fetching questions:", questionError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: questionError.message,
                            },
                        };
                    }

                    console.log("[CustomizedMocksApi] Fetched", questions?.length || 0, "questions");

                    return {
                        data: {
                            examInfo: examInfo,
                            passages: passages || [],
                            questions: questions || [],
                        },
                    };
                } catch (error) {
                    console.log("[CustomizedMocksApi] Error in fetchMockTestById:", error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error while fetching mock test data",
                        },
                    };
                }
            },
            providesTags: ["CustomizedMocks"],
        }),

        // Start a new mock session
        startMockSession: builder.mutation<PracticeSession, StartMockSessionQuery & { time_limit_seconds?: number }>({
            queryFn: async ({ user_id, paper_id, passage_ids, question_ids, time_limit_seconds }) => {
                console.log("[CustomizedMocksApi] startMockSession called for user:", user_id);
                try {
                    // Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log("[CustomizedMocksApi] User is not authenticated");
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
                                session_type: "timed_test",
                                passage_ids: passage_ids && passage_ids.length > 0 ? passage_ids : null,
                                question_ids: question_ids && question_ids.length > 0 ? question_ids : null,
                                time_limit_seconds: time_limit_seconds,
                            },
                        ])
                        .select();

                    if (error) {
                        console.log("[CustomizedMocksApi] Error while creating mock session:", error);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    console.log("[CustomizedMocksApi] Mock session created:", data[0].id);
                    return { data: data[0] };
                } catch (error) {
                    console.log("[CustomizedMocksApi] Error in startMockSession:", error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error while starting mock session",
                        },
                    };
                }
            },
            invalidatesTags: ["MockSessions"],
        }),

        // Fetch existing session details (for resuming)
        fetchExistingMockSession: builder.query<
            { session: PracticeSession; attempts: QuestionAttempt[] }, FetchExistingMockSessionQuery>({
                queryFn: async ({ user_id, paper_id }) => {
                    console.log("[CustomizedMocksApi] fetchExistingMockSession called");
                    try {
                        // Get current user
                        const { data: { user }, error: userError } = await supabase.auth.getUser();

                        if (userError || !user) {
                            console.log("[CustomizedMocksApi] User is not authenticated");
                            return {
                                error: {
                                    status: "UNAUTHORIZED",
                                    data: "User not authenticated",
                                },
                            };
                        }

                        // Fetch the most recent in-progress or paused session
                        const { data: sessionData, error: sessionError } = await supabase
                            .from("practice_sessions")
                            .select("*")
                            .eq("user_id", user_id)
                            .eq("paper_id", paper_id)
                            .eq("session_type", "timed_test")
                            .order("created_at", { ascending: false })
                            .limit(1);

                        if (sessionError) {
                            console.log("[CustomizedMocksApi] Error while fetching existing session:", sessionError);
                            return {
                                error: {
                                    status: "CUSTOM_ERROR",
                                    data: sessionError.message,
                                },
                            };
                        }

                        if (!sessionData || sessionData.length === 0) {
                            console.log("[CustomizedMocksApi] No existing session found");
                            return {
                                error: {
                                    status: "NOT_FOUND",
                                    data: "No existing session found",
                                },
                            };
                        }

                        const session = sessionData[0];
                        console.log("[CustomizedMocksApi] Found existing session:", session.id);

                        // Fetch all attempts for this session
                        const { data: attemptsData, error: attemptsError } = await supabase
                            .from("question_attempts")
                            .select("*")
                            .eq("session_id", session.id);

                        if (attemptsError) {
                            console.log("[CustomizedMocksApi] Error while fetching question attempts:", attemptsError);
                            return {
                                error: {
                                    status: "CUSTOM_ERROR",
                                    data: attemptsError.message,
                                },
                            };
                        }

                        console.log("[CustomizedMocksApi] Fetched", attemptsData?.length || 0, "existing attempts");
                        return {
                            data: {
                                session: session,
                                attempts: attemptsData || [],
                            },
                        };
                    } catch (error) {
                        console.log("[CustomizedMocksApi] Error in fetchExistingMockSession:", error);
                        const e = error as { message?: string };
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: e.message || "Error while fetching existing session details",
                            },
                        };
                    }
                },
                providesTags: ["MockSessions"],
            }),

        // Save session details (update existing session)
        saveMockSessionDetails: builder.mutation<PracticeSession, SaveSessionDetailsQuery>({
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
                console.log("[CustomizedMocksApi] saveMockSessionDetails called for session:", session_id);
                console.log("[CustomizedMocksApi] Session status:", status, "Time spent:", time_spent_seconds, "Score:", score_percentage);
                try {
                    // Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log("[CustomizedMocksApi] User is not authenticated");
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    // Update session
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
                        console.log("[CustomizedMocksApi] Error while saving session details:", error);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    console.log("[CustomizedMocksApi] Session details saved successfully");
                    return { data: data[0] };
                } catch (error) {
                    console.log("[CustomizedMocksApi] Error in saveMockSessionDetails:", error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error while saving session details",
                        },
                    };
                }
            },
            invalidatesTags: ["MockSessions"],
        }),

        // Save question attempts (batch upsert)
        saveMockQuestionAttempts: builder.mutation<QuestionAttempt[], SaveQuestionAttemptsQuery>({
            queryFn: async ({ attempts }) => {
                console.log("[CustomizedMocksApi] saveMockQuestionAttempts called with", attempts.length, "attempts");
                try {
                    // Get current user
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log("[CustomizedMocksApi] User is not authenticated");
                        return {
                            error: {
                                status: "UNAUTHORIZED",
                                data: "User not authenticated",
                            },
                        };
                    }

                    // Upsert attempts
                    const { data, error } = await supabase
                        .from("question_attempts")
                        .upsert(attempts, { onConflict: "user_id, session_id, question_id" })
                        .select();

                    if (error) {
                        console.log("[CustomizedMocksApi] Error while saving question attempts:", error);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    console.log("[CustomizedMocksApi] Question attempts saved successfully");
                    return { data: data || [] };
                } catch (error) {
                    console.log("[CustomizedMocksApi] Error in saveMockQuestionAttempts:", error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error while saving question attempts",
                        },
                    };
                }
            },
            invalidatesTags: ["MockSessions"],
        }),
    }),
});

export const {
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
    useFetchUserMetricProficiencyQuery,
    useFetchAvailableGenresQuery,
} = customizedMocksApi;
