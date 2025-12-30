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
    attempts: Record<UUID, Partial<QuestionAttempt>>; // Keyed by Question ID

    // Session Metadata
    session: PracticeSession;
    startTime: number | null; // Timestamp for current question start
    elapsedTimeSeconds: number; // Total session time

    // UI Transients
    isSubmitting: boolean;
    showQuestionPalette: boolean;
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
    },
    startTime: null,
    elapsedTimeSeconds: 0,
    isSubmitting: false,
    showQuestionPalette: true,
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

            // Map existing attempts to Record<UUID, Attempt>
            state.attempts = {};
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

            const existing = state.attempts[questionId];

            state.attempts[questionId] = {
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
                userId: UUID;
                passageId: UUID | null;
                confidence_level: number;
            }>
        ) => {
            const { questionId, confidence_level, userId, passageId } =
                action.payload;
            const existing = state.attempts[questionId];

            if (existing) {
                state.attempts[questionId] = {
                    ...existing,
                    confidence_level: confidence_level,
                };
            } else {
                // Initialize a partial attempt just to set confidence level
                state.attempts[questionId] = {
                    user_id: userId,
                    session_id: state.session.id!,
                    question_id: questionId,
                    passage_id: passageId,
                    confidence_level: confidence_level,
                    time_spent_seconds: 0,
                    is_correct: false,
                };
            }
        },

        clearResponse: (state) => {
            const questionId = state.questionOrder[state.currentQuestionIndex];

            if (state.attempts[questionId]) {
                delete state.attempts[questionId];
            }
        },

        // --- Navigation ---
        setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
            state.currentQuestionIndex = action.payload;
            state.startTime = Date.now(); // Reset question timer on navigation
        },

        goToNextQuestion: (state) => {
            if (state.currentQuestionIndex < state.questionOrder.length - 1) {
                state.currentQuestionIndex++;
                state.startTime = Date.now();
            }
        },

        goToPreviousQuestion: (state) => {
            if (state.currentQuestionIndex > 0) {
                state.currentQuestionIndex--;
                state.startTime = Date.now();
            }
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
export const selectQuestionOrder = createSelector(
    selectDailyState,
    (s) => s.questionOrder
);
export const selectElapsedTime = createSelector(
    selectDailyState,
    (s) => s.elapsedTimeSeconds
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
    [selectAttempts, selectCurrentQuestionId],
    (attempts, id) => (id ? attempts[id] : undefined)
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
            percentage: total > 0 ? Math.round((answered / total) * 100) : 0,
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
} = dailyPracticeSlice.actions;

export default dailyPracticeSlice.reducer;
