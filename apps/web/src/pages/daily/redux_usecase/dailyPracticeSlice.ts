import {
    createSlice,
    createSelector,
    type PayloadAction,
} from "@reduxjs/toolkit";
import type { PracticeSession, QuestionAttempt, UUID } from "../../../types";

// Simplified State using strict types
interface DailyPracticeState {
    viewMode: "exam" | "solution";
    solutionViewType: "common" | "personalized";

    // Core Data
    currentQuestionIndex: number;
    questionOrder: UUID[];
    attempts: Record<UUID, Partial<QuestionAttempt>>; // Keyed by Question ID - only saved entries

    // Session Metadata
    session: PracticeSession;
    startTime: number | null; // Timestamp for current question start
    elapsedTimeSeconds: number; // Total session time

    // UI Transients
    isSubmitting: boolean;
    showQuestionPalette: boolean;

    // Pending - tracks unsaved answer changes until user commits or navigates away
    pendingAttempts: Record<UUID, Partial<QuestionAttempt>>;
}

const initialState: DailyPracticeState = {
    viewMode: "exam",
    solutionViewType: "common",
    currentQuestionIndex: 0,
    questionOrder: [],
    attempts: {},
    session: {
        id: "",
        user_id: "",
        paper_id: "",
        session_type: "daily_challenge_rc",
        mode: "test",
        passage_ids: [],
        question_ids: [],
        target_difficuly: "",
        target_genres: [],
        target_question_types: [],
        time_limit_seconds: 0,
        time_spent_seconds: 0,
        started_at: "",
        completed_at: "",
        paused_at: "",
        pause_duration_seconds: 0,
        total_questions: 0,
        correct_answers: 0,
        current_question_index: 0,
        is_group_session: false,
        group_id: "",
        status: "in_progress",
        score_percentage: 0,
        points_earned: 0,
        created_at: "",
        updated_at: "",
        is_analysed: false,
    },
    startTime: null,
    elapsedTimeSeconds: 0,
    isSubmitting: false,
    showQuestionPalette: true,
    pendingAttempts: {},
};

const dailyPracticeSlice = createSlice({
    name: "dailyPractice",
    initialState,
    reducers: {
        // --- Initialization ---
        initializeSession: (
            state,
            action: PayloadAction<{
                session: PracticeSession;
                questionIds: UUID[];
                existingAttempts?: QuestionAttempt[];
                elapsedTime?: number;
                status?: string;
            }>
        ) => {
            const { session, questionIds, existingAttempts, elapsedTime, status } =
                action.payload;

            state.session = session;
            state.questionOrder = questionIds;
            state.elapsedTimeSeconds = elapsedTime || 0;
            state.currentQuestionIndex = 0;

            // Map existing attempts or initialize new ones
            state.attempts = {};
            questionIds.forEach((id) => {
                state.attempts[id] = {
                    user_id: session.user_id,
                    session_id: session.id,
                    question_id: id,
                    user_answer: null,
                    is_correct: false,
                    time_spent_seconds: 0,
                    marked_for_review: false,
                };
            });

            if (existingAttempts) {
                existingAttempts.forEach((attempt) => {
                    state.attempts[attempt.question_id] = attempt;
                });
            }

            // Set Mode
            state.viewMode = status === "completed" ? "solution" : "exam";
            state.startTime = Date.now(); // Start timer for first question
        },

        // --- Core Exam Logic ---
        submitAnswer: (
            state,
            action: PayloadAction<{
                questionId: UUID;
                userId: UUID;
                passageId: UUID | null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                answer: any; // user_answer JSON
                isCorrect: boolean;
            }>
        ) => {
            const { questionId, userId, passageId, answer, isCorrect } =
                action.payload;

            // Calculate time spent on this specific attempt
            const timeNow = Date.now();
            const timeSpent = state.startTime
                ? Math.floor((timeNow - state.startTime) / 1000)
                : 0;

            const existing = state.pendingAttempts[questionId] || state.attempts[questionId];

            state.pendingAttempts[questionId] = {
                ...existing,
                user_id: userId,
                session_id: state.session.id!,
                question_id: questionId,
                passage_id: passageId,
                user_answer: { user_answer: answer },
                is_correct: isCorrect,
                // Accumulate time if revisited, otherwise set new
                time_spent_seconds: (existing?.time_spent_seconds || 0) + timeSpent,
                marked_for_review: existing?.marked_for_review || false,
            };

            // Reset start time for the next interaction
            state.startTime = timeNow;
        },

        // Commit pending attempt to saved attempts (called on Save & Next or Mark & Next)
        commitPendingAttempt: (
            state,
            action: PayloadAction<{
                questionId: UUID;
                userId: UUID;
                passageId: UUID | null;
                markForReview?: boolean;
            }>
        ) => {
            const { questionId, userId, passageId, markForReview } = action.payload;

            const timeNow = Date.now();
            const timeSpent = state.startTime ? Math.floor((timeNow - state.startTime) / 1000) : 0;
            state.startTime = timeNow;

            const pending = state.pendingAttempts[questionId];
            const existing = state.attempts[questionId];

            if (pending) {
                state.attempts[questionId] = {
                    ...pending,
                    passage_id: passageId || pending.passage_id,
                    marked_for_review: markForReview ?? pending.marked_for_review ?? false,
                    time_spent_seconds: (pending.time_spent_seconds || 0) + timeSpent,
                };
                // Clear from pending
                delete state.pendingAttempts[questionId];
            } else {
                state.attempts[questionId] = {
                    ...existing,
                    user_id: userId,
                    session_id: state.session.id!,
                    question_id: questionId,
                    passage_id: passageId || existing?.passage_id || null,
                    marked_for_review: markForReview ?? existing?.marked_for_review ?? false,
                    time_spent_seconds: (existing?.time_spent_seconds || 0) + timeSpent,
                    is_correct: existing?.is_correct || false,
                };
            }
        },

        // Clear pending attempt (called on navigation without saving)
        clearPendingAttempt: (
            state,
            action: PayloadAction<UUID>
        ) => {
            const questionId = action.payload;
            delete state.pendingAttempts[questionId];
        },

        // Clear all pending attempts (cleanup)
        clearAllPendingAttempts: (state) => {
            state.pendingAttempts = {};
        },

        toggleMarkForReview: (
            state,
            action: PayloadAction<{
                questionId: UUID;
                userId: UUID;
                passageId: UUID | null;
            }>
        ) => {
            const { questionId, userId, passageId } = action.payload;
            const existing = state.attempts[questionId];

            if (existing) {
                state.attempts[questionId] = {
                    ...existing,
                    marked_for_review: !existing.marked_for_review,
                };
            } else {
                // Initialize a partial attempt just to mark it
                state.attempts[questionId] = {
                    user_id: userId,
                    session_id: state.session.id!,
                    question_id: questionId,
                    passage_id: passageId,
                    marked_for_review: true,
                    time_spent_seconds: 0,
                    is_correct: false,
                };
            }
        },

        updateConfidenceLevel: (
            state,
            action: PayloadAction<{
                questionId: UUID;
                confidence_level: number;
            }>
        ) => {
            const { questionId, confidence_level } = action.payload;

            // First check if there's a pending attempt
            const pending = state.pendingAttempts[questionId];
            if (pending) {
                state.pendingAttempts[questionId] = {
                    ...pending,
                    confidence_level: confidence_level,
                };
            } else {
                // Check if there's an existing saved attempt to copy from
                const existing = state.attempts[questionId];
                if (existing) {
                    state.pendingAttempts[questionId] = {
                        ...existing,
                        confidence_level: confidence_level,
                    };
                } else {
                    // Initialize a partial attempt in pending
                    state.pendingAttempts[questionId] = {
                        question_id: questionId,
                        session_id: state.session.id!,
                        confidence_level: confidence_level,
                        time_spent_seconds: 0,
                        is_correct: false,
                    };
                }
            }
        },

        clearResponse: (state) => {
            const questionId = state.questionOrder[state.currentQuestionIndex];

            if (state.attempts[questionId]) {
                state.attempts[questionId] = {
                    ...state.attempts[questionId],
                    user_answer: null,
                    is_correct: false,
                };
            }
            // Also clear from pending if exists
            if (state.pendingAttempts[questionId]) {
                delete state.pendingAttempts[questionId];
            }
        },

        // --- Navigation ---
        setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
            const previousQuestionId = state.questionOrder[state.currentQuestionIndex];
            const timeNow = Date.now();
            const timeSpent = state.startTime ? Math.floor((timeNow - state.startTime) / 1000) : 0;

            if (previousQuestionId && state.viewMode === "exam") {
                const existing = state.attempts[previousQuestionId] || {};
                const pending = state.pendingAttempts[previousQuestionId] || {};
                
                state.attempts[previousQuestionId] = {
                    ...existing,
                    ...pending,
                    time_spent_seconds: (existing.time_spent_seconds || 0) + (pending.time_spent_seconds || 0) + timeSpent,
                };
                delete state.pendingAttempts[previousQuestionId];
            }
            state.currentQuestionIndex = action.payload;
            state.startTime = timeNow;
        },

        goToNextQuestion: (state) => {
            const currentQuestionId = state.questionOrder[state.currentQuestionIndex];
            const timeNow = Date.now();
            const timeSpent = state.startTime ? Math.floor((timeNow - state.startTime) / 1000) : 0;

            if (currentQuestionId && state.viewMode === "exam") {
                const existing = state.attempts[currentQuestionId] || {};
                const pending = state.pendingAttempts[currentQuestionId] || {};

                state.attempts[currentQuestionId] = {
                    ...existing,
                    ...pending,
                    time_spent_seconds: (existing.time_spent_seconds || 0) + (pending.time_spent_seconds || 0) + timeSpent,
                };
                delete state.pendingAttempts[currentQuestionId];
            }

            if (state.currentQuestionIndex < state.questionOrder.length - 1) {
                state.currentQuestionIndex++;
            } else {
                state.currentQuestionIndex = 0;
            }
            state.startTime = timeNow;
        },

        goToPreviousQuestion: (state) => {
            const currentQuestionId = state.questionOrder[state.currentQuestionIndex];
            const timeNow = Date.now();
            const timeSpent = state.startTime ? Math.floor((timeNow - state.startTime) / 1000) : 0;

            if (currentQuestionId && state.viewMode === "exam") {
                const existing = state.attempts[currentQuestionId] || {};
                const pending = state.pendingAttempts[currentQuestionId] || {};

                state.attempts[currentQuestionId] = {
                    ...existing,
                    ...pending,
                    time_spent_seconds: (existing.time_spent_seconds || 0) + (pending.time_spent_seconds || 0) + timeSpent,
                };
                delete state.pendingAttempts[currentQuestionId];
            }

            if (state.currentQuestionIndex > 0) {
                state.currentQuestionIndex--;
            } else {
                state.currentQuestionIndex = state.questionOrder.length - 1;
            }
            state.startTime = timeNow;
        },

        // --- Timer & System ---
        incrementElapsedTime: (state) => {
            state.elapsedTimeSeconds++;
        },

        setViewMode: (state, action: PayloadAction<"exam" | "solution">) => {
            state.viewMode = action.payload;
        },

        toggleQuestionPalette: (state) => {
            state.showQuestionPalette = !state.showQuestionPalette;
        },

        setSolutionViewType: (
            state,
            action: PayloadAction<"common" | "personalized">
        ) => {
            state.solutionViewType = action.payload;
        },

        updateSessionAnalytics: (
            state,
            action: PayloadAction<{
                session: PracticeSession;
                attempts?: QuestionAttempt[];
            }>
        ) => {
            const { session, attempts } = action.payload;
            state.session = session;
            if (attempts) {
                attempts.forEach((attempt) => {
                    state.attempts[attempt.question_id] = attempt;
                });
            }
        },

        resetDailyPractice: () => initialState,
    },
});

// --- Selectors ---

export const selectDailyState = (state: {
    dailyPractice: DailyPracticeState;
}) => state.dailyPractice;
export const selectViewMode = createSelector(
    selectDailyState,
    (s) => s.viewMode
);
export const selectSolutionViewType = (state: {
    dailyPractice: DailyPracticeState;
}) => state.dailyPractice.solutionViewType;
export const selectCurrentQuestionIndex = createSelector(
    selectDailyState,
    (s) => s.currentQuestionIndex
);
export const selectAttempts = createSelector(
    selectDailyState,
    (s) => s.attempts
);
export const selectPendingAttempts = createSelector(
    selectDailyState,
    (s) => s.pendingAttempts
);
export const selectQuestionOrder = createSelector(
    selectDailyState,
    (s) => s.questionOrder
);
export const selectElapsedTime = createSelector(
    selectDailyState,
    (s) => s.elapsedTimeSeconds
);
export const selectStartTime = createSelector(
    selectDailyState,
    (s) => s.startTime
);
export const selectShowPalette = createSelector(
    selectDailyState,
    (s) => s.showQuestionPalette
);
export const selectSession = createSelector(selectDailyState, (s) => s.session);

export const selectCurrentQuestionId = createSelector(
    [selectQuestionOrder, selectCurrentQuestionIndex],
    (order, index) => order[index] || null
);

export const selectCurrentAttempt = createSelector(
    [selectAttempts, selectPendingAttempts, selectCurrentQuestionId],
    (attempts, pendingAttempts, id) => (id ? (pendingAttempts[id] || attempts[id]) : undefined)
);

export const selectIsLastQuestion = createSelector(
    [selectQuestionOrder, selectCurrentQuestionIndex],
    (order, index) => index === order.length - 1
);

export const selectIsFirstQuestion = createSelector(
    [selectCurrentQuestionIndex],
    (index) => index === 0
);

// Helper to calculate progress derived from attempts
export const selectProgressStats = createSelector(
    [selectAttempts, selectQuestionOrder],
    (attempts, order) => {
        const total = order.length;
        const answered = Object.values(attempts).filter(
            (a) => a.user_answer?.user_answer != null
        ).length;
        const correct = Object.values(attempts).filter((a) => a.is_correct).length;
        return {
            total,
            answered,
            correct,
            percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
        };
    }
);

export const {
    initializeSession,
    submitAnswer,
    toggleMarkForReview,
    clearResponse,
    setCurrentQuestionIndex,
    goToNextQuestion,
    goToPreviousQuestion,
    incrementElapsedTime,
    setViewMode,
    setSolutionViewType,
    toggleQuestionPalette,
    resetDailyPractice,
    updateConfidenceLevel,
    commitPendingAttempt,
    clearPendingAttempt,
    clearAllPendingAttempts,
    updateSessionAnalytics,
} = dailyPracticeSlice.actions;

export default dailyPracticeSlice.reducer;
