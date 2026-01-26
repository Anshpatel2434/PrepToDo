// customizedMocksApi.ts
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../../services/apiClient";
import type { Exam, PracticeSession, UUID, Question, Passage, QuestionAttempt, UserMetricProficiency, Genre } from "../../../types";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

// Real-time generation tracking types
export interface ExamGenerationState {
    exam_id: UUID;
    status: GenerationStatus;
    current_step: number;
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

export const customizedMocksApi = createApi({
    reducerPath: "customizedMocksApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["CustomizedMocks", "MockSessions", "UserMetricProficiency", "GenerationState"],
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

                    console.log("[CustomizedMocksApi] Calling edge function: customized-mocks-init");

                    // Call the customized-mocks edge function
                    const { data, error } = await supabase.functions.invoke("customized-mocks-init", {
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
            async onQueryStarted(params, { dispatch, queryFulfilled }) {
                console.log("[CustomizedMocksApi] Optimistic update: Creating temporary mock card");

                // Create optimistic mock with temporary ID
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

                // Add optimistic mock to cache immediately
                const patchResult = dispatch(
                    customizedMocksApi.util.updateQueryData('fetchCustomizedMocks', undefined, (draft) => {
                        // Add to beginning of list
                        draft.unshift(optimisticMock as unknown as CustomizedMockWithSession);
                    })
                );

                try {
                    // Wait for the mutation to complete
                    const { data: result } = await queryFulfilled;
                    console.log("[CustomizedMocksApi] Mock generation completed successfully");

                    // Update the optimistic mock with the real exam_id
                    if (result.success && result.exam_id) {
                        console.log("[CustomizedMocksApi] Updating optimistic mock with real exam_id:", result.exam_id);
                        dispatch(
                            customizedMocksApi.util.updateQueryData('fetchCustomizedMocks', undefined, (draft) => {
                                const mockIndex = draft.findIndex(m => m.id === tempId);
                                if (mockIndex !== -1) {
                                    // Update the temporary mock with real exam_id
                                    // Use type assertion to bypass readonly check if necessary, or ensure type compatibility
                                    const mockToUpdate = draft[mockIndex] as unknown as { exam_id: UUID | undefined };
                                    mockToUpdate.exam_id = result.exam_id;
                                }
                            })
                        );
                    }

                    // Success - the invalidatesTags will trigger a refetch that replaces the optimistic mock
                } catch {
                    console.log("[CustomizedMocksApi] Mock generation failed, removing optimistic mock");
                    // Failed - remove the optimistic mock
                    patchResult.undo();
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

        // Fetch generation state for real-time tracking
        fetchGenerationState: builder.query<GenerationStateResponse, UUID>({
            queryFn: async (examId) => {
                console.log("[CustomizedMocksApi] fetchGenerationState called for exam_id:", examId);

                // Validate examId
                if (!examId || typeof examId !== 'string') {
                    console.error("[CustomizedMocksApi] Invalid exam_id provided:", examId);
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: "Invalid exam_id provided",
                        },
                    };
                }

                try {
                    // Initial fetch from exam_generation_state table
                    const { data, error } = await supabase
                        .from("exam_generation_state")
                        .select("*")
                        .eq("exam_id", examId)
                        .maybeSingle();

                    if (error) {
                        console.log("[CustomizedMocksApi] Error fetching generation state:", error);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: error.message,
                            },
                        };
                    }

                    // Validate the data structure if it exists
                    if (data) {
                        // Ensure required fields exist with sensible defaults
                        const validatedData: ExamGenerationState = {
                            exam_id: data.exam_id ?? examId,
                            status: data.status ?? "initializing",
                            current_step: typeof data.current_step === 'number' ? data.current_step : 1,
                            total_steps: typeof data.total_steps === 'number' ? data.total_steps : 7,
                            error_message: data.error_message ?? undefined,
                            created_at: data.created_at ?? new Date().toISOString(),
                            updated_at: data.updated_at ?? new Date().toISOString(),
                        };

                        // Determine if generation is in progress
                        const isGenerating =
                            validatedData.status !== "completed" &&
                            validatedData.status !== "failed";

                        console.log("[CustomizedMocksApi] Generation state:", {
                            status: validatedData.status,
                            isGenerating,
                        });

                        return {
                            data: {
                                state: validatedData,
                                isGenerating,
                            },
                        };
                    }

                    // No data found - return null state
                    console.log("[CustomizedMocksApi] No generation state found for exam_id:", examId);
                    return {
                        data: {
                            state: null,
                            isGenerating: false,
                        },
                    };
                } catch (error) {
                    console.log("[CustomizedMocksApi] Error in fetchGenerationState:", error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error fetching generation state",
                        },
                    };
                }
            },

            async onCacheEntryAdded(
                examId,
                { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
            ) {
                let subscription: RealtimeChannel | null = null;

                try {
                    console.log("[CustomizedMocksApi] Setting up real-time subscription for exam_id:", examId);

                    // Wait for initial data to be loaded
                    await cacheDataLoaded;

                    // Set up Supabase real-time subscription with comprehensive error handling
                    // We listen to ALL events (*) to catch INSERT, UPDATE, and DELETE
                    subscription = supabase
                        .channel(`exam_generation:${examId}`)
                        .on(
                            "postgres_changes",
                            {
                                event: "*",
                                schema: "public",
                                table: "exam_generation_state",
                                // We filter manually in the callback to be safe and debug easier
                                // filter: `exam_id=eq.${examId}`, 
                            },
                            (payload) => {
                                try {
                                    console.log("[CustomizedMocksApi] Received real-time update payload:", payload);

                                    // Handle DELETE event (Generation Completed/Cleaned up)
                                    if (payload.eventType === 'DELETE') {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        if (payload.old && (payload.old as any).exam_id === examId) {
                                            console.log("[CustomizedMocksApi] DELETE event detected for this exam. Generation presumably completed.");

                                            // Update cache to stop loading
                                            updateCachedData((draft) => {
                                                draft.isGenerating = false;
                                                // We keep the last known state or set to completed if we want
                                                if (draft.state) {
                                                    draft.state.status = "completed";
                                                }
                                            });

                                            // Invalidate tags to refresh the list
                                            console.log("[CustomizedMocksApi] Invalidating tags to refresh mock list...");
                                            dispatch(customizedMocksApi.util.invalidateTags(["CustomizedMocks"]));

                                            // Unsubscribe
                                            subscription?.unsubscribe();
                                        }
                                        return;
                                    }

                                    // Handle INSERT / UPDATE
                                    const newState = payload.new as ExamGenerationState;

                                    // Check if this update is for our exam
                                    if (newState && newState.exam_id === examId) {
                                        console.log("[CustomizedMocksApi] Processing update for our exam:", newState.status);

                                        // Update the cached data
                                        updateCachedData((draft) => {
                                            draft.state = newState;
                                            draft.isGenerating =
                                                newState.status !== "completed" &&
                                                newState.status !== "failed";
                                        });

                                        // If generation completed or failed, we should refresh the main list
                                        if (
                                            newState.status === "completed" ||
                                            newState.status === "failed"
                                        ) {
                                            console.log("[CustomizedMocksApi] Generation terminal state reached. Refreshing list.");
                                            dispatch(customizedMocksApi.util.invalidateTags(["CustomizedMocks"]));

                                            console.log("[CustomizedMocksApi] Unsubscribing...");
                                            subscription?.unsubscribe();
                                        }
                                    }
                                } catch (updateError) {
                                    console.error("[CustomizedMocksApi] Error processing subscription update:", updateError);
                                }
                            }
                        )
                        .subscribe((status) => {
                            console.log(`[CustomizedMocksApi] Subscription status for ${examId}:`, status);
                            if (status === "CHANNEL_ERROR") {
                                console.error("[CustomizedMocksApi] Channel error for exam:", examId);
                            }
                            if (status === "TIMED_OUT") {
                                console.error("[CustomizedMocksApi] Subscription timed out for exam:", examId);
                            }
                        });
                } catch (error) {
                    console.error("[CustomizedMocksApi] Failed to set up subscription:", error);
                }

                // Cleanup on cache entry removal
                try {
                    await cacheEntryRemoved;
                    console.log("[CustomizedMocksApi] Cache entry removed, cleaning up subscription for exam_id:", examId);
                    if (subscription) {
                        subscription.unsubscribe();
                    }
                } catch (cleanupError) {
                    console.error("[CustomizedMocksApi] Error during subscription cleanup:", cleanupError);
                }
            },

            providesTags: (_result, _error, examId) => [
                { type: "GenerationState", id: examId },
            ],
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
    useFetchGenerationStateQuery,
} = customizedMocksApi;
