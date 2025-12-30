// dailyPracticeSlice.ts
import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { QuestionAttempt, UUID } from '../../../types';

interface DailyPracticeState {
    // Mode management
    viewMode: 'exam' | 'solution';
    solutionViewType: 'common' | 'personalized';

    // Current question index
    currentQuestionIndex: number;

    // User attempts keyed by question ID (local state until save)
    attempts: Record<UUID, Omit<QuestionAttempt, 'id' | 'created_at'>>;

    // Question order (for reordering para jumble)
    questionOrder: UUID[];

    // Timer
    startTime: number | null;
    elapsedTimeSeconds: number;

    // UI state
    selectedOption: string | null;
    confidenceLevel: number | null;
    isSubmitting: boolean;
    showQuestionPalette: boolean;
}

const initialState: DailyPracticeState = {
    viewMode: 'exam',
    solutionViewType: 'common',
    currentQuestionIndex: 0,
    attempts: {},
    questionOrder: [],
    startTime: null,
    elapsedTimeSeconds: 0,
    selectedOption: null,
    confidenceLevel: null,
    isSubmitting: false,
    showQuestionPalette: true,
};

const dailyPracticeSlice = createSlice({
    name: 'dailyPractice',
    initialState,
    reducers: {
        // Mode management
        setViewMode: (state, action: PayloadAction<'exam' | 'solution'>) => {
            console.log('[DailyPracticeSlice] setViewMode:', action.payload);
            state.viewMode = action.payload;
        },
        setSolutionViewType: (state, action: PayloadAction<'common' | 'personalized'>) => {
            state.solutionViewType = action.payload;
        },

        // Navigation
        setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
            console.log('[DailyPracticeSlice] setCurrentQuestionIndex:', action.payload);
            state.currentQuestionIndex = action.payload;
            const questionId = state.questionOrder[action.payload];
            if (questionId) {
                const attempt = state.attempts[questionId];
                if (attempt) {
                    // Try to extract selected option from user_answer JSON
                    const userAnswer = attempt.user_answer as any;
                    state.selectedOption = userAnswer?.user_answer ?? null;
                    state.confidenceLevel = attempt.confidence_level ?? null;
                    console.log('[DailyPracticeSlice] Loaded existing attempt for question:', questionId);
                } else {
                    state.selectedOption = null;
                    state.confidenceLevel = null;
                    console.log('[DailyPracticeSlice] No existing attempt for question:', questionId);
                }
            } else {
                state.selectedOption = null;
                state.confidenceLevel = null;
            }
        },
        goToNextQuestion: (state) => {
            if (state.currentQuestionIndex < state.questionOrder.length - 1) {
                state.currentQuestionIndex += 1;
                console.log('[DailyPracticeSlice] goToNextQuestion:', state.currentQuestionIndex);
                const questionId = state.questionOrder[state.currentQuestionIndex];
                if (questionId) {
                    const attempt = state.attempts[questionId];
                    if (attempt) {
                        const userAnswer = attempt.user_answer as any;
                        state.selectedOption = userAnswer?.user_answer ?? null;
                        state.confidenceLevel = attempt.confidence_level ?? null;
                        console.log('[DailyPracticeSlice] Loaded existing attempt for question:', questionId);
                    } else {
                        state.selectedOption = null;
                        state.confidenceLevel = null;
                        console.log('[DailyPracticeSlice] No existing attempt for question:', questionId);
                    }
                }
            }
        },
        goToPreviousQuestion: (state) => {
            if (state.currentQuestionIndex > 0) {
                state.currentQuestionIndex -= 1;
                console.log('[DailyPracticeSlice] goToPreviousQuestion:', state.currentQuestionIndex);
                const questionId = state.questionOrder[state.currentQuestionIndex];
                if (questionId) {
                    const attempt = state.attempts[questionId];
                    if (attempt) {
                        const userAnswer = attempt.user_answer as any;
                        state.selectedOption = userAnswer?.user_answer ?? null;
                        state.confidenceLevel = attempt.confidence_level ?? null;
                        console.log('[DailyPracticeSlice] Loaded existing attempt for question:', questionId);
                    } else {
                        state.selectedOption = null;
                        state.confidenceLevel = null;
                        console.log('[DailyPracticeSlice] No existing attempt for question:', questionId);
                    }
                }
            }
        },

        // Answer selection
        setSelectedOption: (state, action: PayloadAction<string | null>) => {
            console.log('[DailyPracticeSlice] setSelectedOption:', action.payload);
            state.selectedOption = action.payload;
        },

        // Clear response for current question
        clearResponse: (state) => {
            console.log('[DailyPracticeSlice] clearResponse');
            state.selectedOption = null;
            state.confidenceLevel = null;
            const questionId = state.questionOrder[state.currentQuestionIndex];
            if (questionId && state.attempts[questionId]) {
                // Remove the attempt for current question
                delete state.attempts[questionId];
                console.log('[DailyPracticeSlice] Cleared attempt for question:', questionId);
            }
        },

        // Confidence level
        setConfidenceLevel: (state, action: PayloadAction<number | null>) => {
            console.log('[DailyPracticeSlice] setConfidenceLevel:', action.payload);
            state.confidenceLevel = action.payload;
        },

        // Submit answer (creates or updates attempt for current question)
        submitAnswer: (
            state,
            action: PayloadAction<{
                user_id: UUID;
                session_id: UUID;
                passage_id: UUID | null;
                correct_answer: any;
            }>
        ) => {
            const questionId = state.questionOrder[state.currentQuestionIndex];
            if (!questionId) return;

            const { user_id, session_id, passage_id, correct_answer } = action.payload;
            const timeSpent = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;

            // Determine if answer is correct
            const userAnswerValue = state.selectedOption;
            const isCorrect = userAnswerValue === correct_answer;

            console.log('[DailyPracticeSlice] submitAnswer for question:', questionId);
            console.log('[DailyPracticeSlice] User answer:', userAnswerValue, 'Correct answer:', correct_answer, 'Is correct:', isCorrect);
            console.log('[DailyPracticeSlice] Time spent on this attempt:', timeSpent, 'seconds');

            // Get existing attempt or create new structure
            const existingAttempt = state.attempts[questionId];

            state.attempts[questionId] = {
                user_id,
                session_id,
                question_id: questionId,
                passage_id,
                user_answer: { user_answer: userAnswerValue },
                is_correct: isCorrect,
                time_spent_seconds: existingAttempt?.time_spent_seconds
                    ? existingAttempt.time_spent_seconds + timeSpent
                    : timeSpent,
                confidence_level: state.confidenceLevel,
                marked_for_review: existingAttempt?.marked_for_review ?? false,
                rationale_viewed: existingAttempt?.rationale_viewed ?? false,
                rationale_helpful: existingAttempt?.rationale_helpful ?? null,
                ai_feedback: existingAttempt?.ai_feedback ?? null,
            };

            console.log('[DailyPracticeSlice] Attempt saved to Redux state for question:', questionId);
        },

        // Mark for review
        toggleMarkForReview: (
            state,
            action: PayloadAction<{
                user_id: UUID;
                session_id: UUID;
                passage_id: UUID | null;
            }>
        ) => {
            const questionId = state.questionOrder[state.currentQuestionIndex];
            if (!questionId) return;

            const { user_id, session_id, passage_id } = action.payload;
            const existingAttempt = state.attempts[questionId];
            const currentMarkedStatus = existingAttempt?.marked_for_review ?? false;
            const newMarkedStatus = !currentMarkedStatus;

            console.log('[DailyPracticeSlice] toggleMarkForReview for question:', questionId, 'New status:', newMarkedStatus);

            if (existingAttempt) {
                // Update existing attempt
                state.attempts[questionId] = {
                    ...existingAttempt,
                    marked_for_review: newMarkedStatus,
                };
            } else {
                // Create new attempt with marked status
                state.attempts[questionId] = {
                    user_id,
                    session_id,
                    question_id: questionId,
                    passage_id,
                    user_answer: { user_answer: state.selectedOption },
                    is_correct: false, // Will be updated on submit
                    time_spent_seconds: 0,
                    confidence_level: state.confidenceLevel,
                    marked_for_review: true,
                    rationale_viewed: false,
                    rationale_helpful: true,
                    ai_feedback: null,
                };
            }

            console.log('[DailyPracticeSlice] Attempt marked for review:', questionId);
        },

        // Update specific attempt fields
        updateAttemptField: (
            state,
            action: PayloadAction<{
                questionId: UUID;
                field: keyof Omit<QuestionAttempt, 'id' | 'created_at'>;
                value: any;
            }>
        ) => {
            const { questionId, field, value } = action.payload;
            const existingAttempt = state.attempts[questionId];
            if (existingAttempt) {
                (state.attempts[questionId] as any)[field] = value;
            }
        },

        // Timer
        setStartTime: (state, action: PayloadAction<number | null>) => {
            console.log('[DailyPracticeSlice] setStartTime:', action.payload);
            state.startTime = action.payload;
        },
        setElapsedTime: (state, action: PayloadAction<number>) => {
            console.log('[DailyPracticeSlice] setElapsedTime:', action.payload);
            state.elapsedTimeSeconds = action.payload;
        },
        incrementElapsedTime: (state) => {
            state.elapsedTimeSeconds += 1;
        },

        // UI state
        setIsSubmitting: (state, action: PayloadAction<boolean>) => {
            state.isSubmitting = action.payload;
        },
        toggleQuestionPalette: (state) => {
            state.showQuestionPalette = !state.showQuestionPalette;
        },

        // Para jumble ordering
        setQuestionOrder: (state, action: PayloadAction<UUID[]>) => {
            state.questionOrder = action.payload;
        },

        // Load existing attempts (from fetched session)
        loadExistingAttempts: (
            state,
            action: PayloadAction<QuestionAttempt[]>
        ) => {
            console.log('[DailyPracticeSlice] loadExistingAttempts:', action.payload.length, 'attempts');
            const attemptsMap: Record<UUID, Omit<QuestionAttempt, 'id' | 'created_at'>> = {};

            action.payload.forEach((attempt) => {
                const { id, created_at, ...attemptData } = attempt;
                attemptsMap[attempt.question_id] = attemptData;
            });

            state.attempts = attemptsMap;
            console.log('[DailyPracticeSlice] Loaded', Object.keys(attemptsMap).length, 'existing attempts into Redux state');
        },

        // Reset state
        resetDailyPractice: () => {
            console.log('[DailyPracticeSlice] resetDailyPractice');
            return initialState;
        },

        // Initialize practice session
        initializeSession: (
            state,
            action: PayloadAction<{
                questionIds: UUID[];
                currentIndex?: number;
                elapsedTime?: number;
            }>
        ) => {
            console.log('[DailyPracticeSlice] initializeSession with', action.payload.questionIds.length, 'questions');
            state.questionOrder = action.payload.questionIds;
            state.currentQuestionIndex = action.payload.currentIndex ?? 0;
            state.startTime = Date.now();
            state.elapsedTimeSeconds = action.payload.elapsedTime ?? 0;
            state.attempts = {};
            state.selectedOption = null;
            state.confidenceLevel = null;
            state.viewMode = 'exam';
            state.solutionViewType = 'common';
            console.log('[DailyPracticeSlice] Session initialized with fresh state');
        },

        // Initialize practice session with existing attempts (for resuming)
        initializeSessionWithAttempts: (
            state,
            action: PayloadAction<{
                questionIds: UUID[];
                currentIndex?: number;
                elapsedTime?: number;
                attempts: Record<UUID, Omit<QuestionAttempt, 'id' | 'created_at'>>;
            }>
        ) => {
            console.log('[DailyPracticeSlice] initializeSessionWithAttempts with', action.payload.questionIds.length, 'questions');
            console.log('[DailyPracticeSlice] Loading', Object.keys(action.payload.attempts).length, 'existing attempts');
            state.questionOrder = action.payload.questionIds;
            state.currentQuestionIndex = action.payload.currentIndex ?? 0;
            state.startTime = Date.now();
            state.elapsedTimeSeconds = action.payload.elapsedTime ?? 0;
            state.attempts = action.payload.attempts;
            state.selectedOption = null;
            state.confidenceLevel = null;
            state.viewMode = 'exam';
            state.solutionViewType = 'common';
            console.log('[DailyPracticeSlice] Session initialized with existing attempts');
        },
    },
});

export const {
    setViewMode,
    setSolutionViewType,
    setCurrentQuestionIndex,
    goToNextQuestion,
    goToPreviousQuestion,
    setSelectedOption,
    clearResponse,
    setConfidenceLevel,
    submitAnswer,
    toggleMarkForReview,
    updateAttemptField,
    setStartTime,
    setElapsedTime,
    incrementElapsedTime,
    setIsSubmitting,
    toggleQuestionPalette,
    setQuestionOrder,
    loadExistingAttempts,
    resetDailyPractice,
    initializeSession,
    initializeSessionWithAttempts,
} = dailyPracticeSlice.actions;

// Selectors
export const selectViewMode = (state: { dailyPractice: DailyPracticeState }) => 
    state.dailyPractice.viewMode;
export const selectSolutionViewType = (state: { dailyPractice: DailyPracticeState }) => 
    state.dailyPractice.solutionViewType;
export const selectCurrentQuestionIndex = (state: { dailyPractice: DailyPracticeState }) => 
    state.dailyPractice.currentQuestionIndex;
export const selectAttempts = (state: { dailyPractice: DailyPracticeState }) => 
    state.dailyPractice.attempts;
export const selectQuestionOrder = (state: { dailyPractice: DailyPracticeState }) => 
    state.dailyPractice.questionOrder;
export const selectStartTime = (state: { dailyPractice: DailyPracticeState }) => 
    state.dailyPractice.startTime;
export const selectElapsedTime = (state: { dailyPractice: DailyPracticeState }) => 
    state.dailyPractice.elapsedTimeSeconds;
export const selectSelectedOption = (state: { dailyPractice: DailyPracticeState }) => 
    state.dailyPractice.selectedOption;
export const selectConfidenceLevel = (state: { dailyPractice: DailyPracticeState }) => 
    state.dailyPractice.confidenceLevel;
export const selectIsSubmitting = (state: { dailyPractice: DailyPracticeState }) => 
    state.dailyPractice.isSubmitting;
export const selectShowQuestionPalette = (state: { dailyPractice: DailyPracticeState }) => 
    state.dailyPractice.showQuestionPalette;

export const selectCurrentQuestionId = createSelector(
    [selectQuestionOrder, selectCurrentQuestionIndex],
    (questionOrder, currentIndex) => questionOrder[currentIndex] ?? null
);

export const selectCurrentAttempt = createSelector(
    [selectAttempts, selectCurrentQuestionId],
    (attempts, currentQuestionId) => 
        currentQuestionId ? attempts[currentQuestionId] ?? null : null
);

export const selectQuestionStatusCounts = createSelector(
    [selectAttempts, selectQuestionOrder],
    (attempts, questionOrder) => {
        const counts = {
            answered: 0,
            marked_for_review: 0,
            not_visited: 0,
        };

        for (const questionId of questionOrder) {
            const attempt = attempts[questionId];
            if (attempt) {
                if (attempt.marked_for_review) {
                    counts.marked_for_review += 1;
                } else {
                    counts.answered += 1;
                }
            } else {
                counts.not_visited += 1;
            }
        }

        return counts;
    }
);

export const selectIsLastQuestion = createSelector(
    [selectCurrentQuestionIndex, selectQuestionOrder],
    (currentIndex, questionOrder) => currentIndex === questionOrder.length - 1
);

export const selectIsFirstQuestion = createSelector(
    [selectCurrentQuestionIndex],
    (currentIndex) => currentIndex === 0
);

export const selectIsQuestionAnswered = createSelector(
    [selectCurrentAttempt],
    (attempt) => {
        if (!attempt) return false;
        const userAnswer = attempt.user_answer as any;
        return userAnswer?.user_answer != null;
    }
);

export const selectIsQuestionMarkedForReview = createSelector(
    [selectCurrentAttempt],
    (attempt) => attempt?.marked_for_review ?? false
);

export const selectTotalCorrectAnswers = createSelector(
    [selectAttempts],
    (attempts) => {
        return Object.values(attempts).filter(attempt => attempt.is_correct).length;
    }
);

export const selectTotalTimeSpent = createSelector(
    [selectAttempts],
    (attempts) => {
        return Object.values(attempts).reduce(
            (total, attempt) => total + attempt.time_spent_seconds, 
            0
        );
    }
);

export const selectAccuracyPercentage = createSelector(
    [selectAttempts],
    (attempts) => {
        const answeredQuestions = Object.values(attempts).filter(
            attempt => {
                const userAnswer = attempt.user_answer as any;
                return userAnswer?.user_answer != null;
            }
        );
        
        if (answeredQuestions.length === 0) return 0;
        
        const correctCount = answeredQuestions.filter(attempt => attempt.is_correct).length;
        return Math.round((correctCount / answeredQuestions.length) * 100);
    }
);

export default dailyPracticeSlice.reducer;