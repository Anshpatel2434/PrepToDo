// dailyPracticeApi.ts
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../../services/apiClient";
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

interface SessionData {
    id: UUID;
    user_id: UUID;
    paper_id: UUID;
    session_type: string;
    time_spent_seconds: number;
    total_questions: number;
    correct_answers: number;
    score_percentage: number | null;
    completed_at: string | null;
    created_at: string;
}

interface UserProfile {
    id: UUID;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
}

// Calculate leaderboard from sessions
function calculateLeaderboard(
    sessions: SessionData[],
    profiles: UserProfile[]
): Map<UUID, LeaderboardEntry> {
    const leaderboardMap = new Map<UUID, LeaderboardEntry>();
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // Group sessions by user
    const userSessions = new Map<UUID, SessionData[]>();
    sessions.forEach(session => {
        if (!userSessions.has(session.user_id)) {
            userSessions.set(session.user_id, []);
        }
        userSessions.get(session.user_id)!.push(session);
    });

    // Calculate metrics for each user
    userSessions.forEach((userSessionList, userId) => {
        const profile = profileMap.get(userId);
        if (!profile) return;

        // Aggregate metrics across all sessions for this exam
        let totalQuestions = 0;
        let totalCorrect = 0;
        let totalTime = 0;

        userSessionList.forEach(session => {
            totalQuestions += session.total_questions || 0;
            totalCorrect += session.correct_answers || 0;
            totalTime += session.time_spent_seconds || 0;
        });

        const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        const avgTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;

        // Calculate composite score
        // Score = (Accuracy * 0.6) + (Speed Bonus * 0.4)
        // Speed Bonus: faster is better, normalized to 0-100 scale
        // Assuming 60 seconds per question is baseline (0 bonus), 30 seconds is excellent (100 bonus)
        const speedBonus = Math.max(0, Math.min(100, 100 - (avgTimePerQuestion - 30) * 2));
        const score = (accuracy * 0.6) + (speedBonus * 0.4);

        leaderboardMap.set(userId, {
            rank: 0, // Will be assigned later
            user_id: userId,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            score: Math.round(score * 100) / 100,
            accuracy: Math.round(accuracy * 100) / 100,
            time_taken_seconds: totalTime,
            questions_attempted: totalQuestions,
            avg_time_per_question: Math.round(avgTimePerQuestion * 100) / 100,
        });
    });

    return leaderboardMap;
}

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

                    // Step 2: Get today's daily practice exam for 2026 (filter by today's date)
                    const today = new Date().toISOString().split('T')[0];
                    const startOfToday = `${today}T00:00:00.000Z`;
                    const endOfToday = `${today}T23:59:59.999Z`;
                    console.log('[DailyPracticeApi] Fetching exam for date:', today);

                    const { data: examInfo, error: examInfoError } = await supabase
                        .from("exam_papers")
                        .select("*")
                        .eq("year", 2026)
                        .eq("name", "Daily Practice")
                        .eq("generation_status", "completed")
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

                    console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ ", examInfo)

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

                    // Get today's date range for filtering
                    // const today = new Date().toISOString().split('T')[0];

                    // Calculate range for pagination
                    const offset = (page - 1) * limit;
                    const from = offset;
                    const to = from + limit - 1;

                    // Step 2: Get previous daily practice exams with pagination, excluding today's exam
                    const { data: examInfo, error: examInfoError } = await supabase
                        .from("exam_papers")
                        .select("*")
                        .eq("year", 2026)
                        .eq("name", "Daily Practice")
                        .eq("generation_status", "completed")
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

                    console.log('[DailyPracticeApi] Fetched', examInfo?.length || 0, 'previous exams (excluding today) for page', page);

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

        // Fetch articles by IDs
        fetchArticlesByIds: builder.query<Article[], { article_ids: UUID[] }>({
            queryFn: async ({ article_ids }) => {
                console.log('[DailyPracticeApi] fetchArticlesByIds called with IDs:', article_ids);
                try {

                    // If no article IDs provided, return empty array
                    if (!article_ids || article_ids.length === 0) {
                        console.log('[DailyPracticeApi] No article IDs provided, returning empty array');
                        return {
                            data: [],
                        };
                    }

                    // Step 2: Fetch articles by IDs
                    const { data: articles, error: articlesError } = await supabase
                        .from("articles")
                        .select("*")
                        .in("id", article_ids);

                    if (articlesError) {
                        console.log('[DailyPracticeApi] Error while fetching articles:', articlesError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: articlesError.message,
                            },
                        };
                    }

                    console.log('[DailyPracticeApi] Fetched', articles?.length || 0, 'articles');

                    return {
                        data: articles || [],
                    };
                } catch (error) {
                    console.log('[DailyPracticeApi] Error in fetchArticlesByIds:', error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error while fetching articles",
                        },
                    };
                }
            },
            providesTags: ["DailyPractice"],
        }),

        // Fetch leaderboard for a specific exam
        fetchDailyLeaderboard: builder.query<LeaderboardData, { exam_id: UUID }>({
            queryFn: async ({ exam_id }) => {
                console.log('[DailyPracticeApi] fetchDailyLeaderboard called for exam_id:', exam_id);
                try {
                    // Check if user is logged in (optional for leaderboard viewing)
                    const { data: { user } } = await supabase.auth.getUser();
                    const currentUserId = user?.id || null;
                    console.log('[DailyPracticeApi] User logged in:', !!currentUserId);

                    // Fetch all completed sessions for this exam
                    const { data: sessions, error: sessionsError } = await supabase
                        .from("practice_sessions")
                        .select(`
                            id,
                            user_id,
                            paper_id,
                            session_type,
                            time_spent_seconds,
                            total_questions,
                            correct_answers,
                            score_percentage,
                            completed_at,
                            created_at
                        `)
                        .eq("paper_id", `${exam_id}`)
                        .eq("status", "completed")
                        .in("session_type", ["daily_challenge_rc", "daily_challenge_va"]);

                    console.log(sessions)

                    if (sessionsError) {
                        console.log('[DailyPracticeApi] Error fetching sessions:', sessionsError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: sessionsError.message,
                            },
                        };
                    }

                    if (!sessions || sessions.length === 0) {
                        console.log('[DailyPracticeApi] No completed sessions found for this exam');
                        return {
                            data: {
                                leaderboard: [],
                                currentUserRank: null,
                                totalParticipants: 0,
                            },
                        };
                    }

                    // Get unique user IDs
                    const userIds = [...new Set(sessions.map(s => s.user_id))];

                    // Fetch user profiles
                    const { data: profiles, error: profilesError } = await supabase
                        .from("user_profiles")
                        .select("id, username, display_name, avatar_url")
                        .in("id", userIds);

                    if (profilesError) {
                        console.log('[DailyPracticeApi] Error fetching profiles:', profilesError);
                        return {
                            error: {
                                status: "CUSTOM_ERROR",
                                data: profilesError.message,
                            },
                        };
                    }

                    // Calculate leaderboard entries
                    const leaderboardMap = calculateLeaderboard(sessions, profiles || []);
                    const sortedLeaderboard = Array.from(leaderboardMap.values())
                        .sort((a, b) => b.score - a.score);

                    // Assign ranks
                    sortedLeaderboard.forEach((entry, index) => {
                        entry.rank = index + 1;
                    });

                    // Find current user's rank (only if logged in)
                    const currentUserEntry = currentUserId
                        ? sortedLeaderboard.find(entry => entry.user_id === currentUserId)
                        : null;
                    const currentUserRank = currentUserEntry?.rank || null;

                    // Get top 30
                    const top30 = sortedLeaderboard.slice(0, 30);

                    // If user is logged in and not in top 30, add them separately
                    let leaderboard = top30;
                    if (currentUserId && currentUserRank && currentUserRank > 30 && currentUserEntry) {
                        leaderboard = [...top30, currentUserEntry];
                    }

                    console.log('[DailyPracticeApi] Leaderboard calculated:', leaderboard.length, 'entries');

                    return {
                        data: {
                            leaderboard,
                            currentUserRank,
                            totalParticipants: sortedLeaderboard.length,
                        },
                    };
                } catch (error) {
                    console.log('[DailyPracticeApi] Error in fetchDailyLeaderboard:', error);
                    const e = error as { message?: string };
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            data: e.message || "Error while fetching leaderboard",
                        },
                    };
                }
            },
            providesTags: ["DailyPractice"],
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
    useFetchArticlesByIdsQuery,
    useLazyFetchArticlesByIdsQuery,
    useFetchDailyLeaderboardQuery,
    useLazyFetchDailyLeaderboardQuery,
} = dailyPracticeApi;