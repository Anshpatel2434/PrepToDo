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
            state.viewMode = action.payload;
        },
        setSolutionViewType: (state, action: PayloadAction<'common' | 'personalized'>) => {
            state.solutionViewType = action.payload;
        },

        // Navigation
        setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
            state.currentQuestionIndex = action.payload;
            const questionId = state.questionOrder[action.payload];
            if (questionId) {
                const attempt = state.attempts[questionId];
                if (attempt) {
                    // Try to extract selected option from user_answer JSON
                    const userAnswer = attempt.user_answer as any;
                    state.selectedOption = userAnswer?.user_answer ?? null;
                    state.confidenceLevel = attempt.confidence_level ?? null;
                } else {
                    state.selectedOption = null;
                    state.confidenceLevel = null;
                }
            } else {
                state.selectedOption = null;
                state.confidenceLevel = null;
            }
        },
        goToNextQuestion: (state) => {
            if (state.currentQuestionIndex < state.questionOrder.length - 1) {
                state.currentQuestionIndex += 1;
                const questionId = state.questionOrder[state.currentQuestionIndex];
                if (questionId) {
                    const attempt = state.attempts[questionId];
                    if (attempt) {
                        const userAnswer = attempt.user_answer as any;
                        state.selectedOption = userAnswer?.user_answer ?? null;
                        state.confidenceLevel = attempt.confidence_level ?? null;
                    } else {
                        state.selectedOption = null;
                        state.confidenceLevel = null;
                    }
                }
            }
        },
        goToPreviousQuestion: (state) => {
            if (state.currentQuestionIndex > 0) {
                state.currentQuestionIndex -= 1;
                const questionId = state.questionOrder[state.currentQuestionIndex];
                if (questionId) {
                    const attempt = state.attempts[questionId];
                    if (attempt) {
                        const userAnswer = attempt.user_answer as any;
                        state.selectedOption = userAnswer?.user_answer ?? null;
                        state.confidenceLevel = attempt.confidence_level ?? null;
                    } else {
                        state.selectedOption = null;
                        state.confidenceLevel = null;
                    }
                }
            }
        },

        // Answer selection
        setSelectedOption: (state, action: PayloadAction<string | null>) => {
            state.selectedOption = action.payload;
        },

        // Confidence level
        setConfidenceLevel: (state, action: PayloadAction<number | null>) => {
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

            if (existingAttempt) {
                // Update existing attempt
                state.attempts[questionId] = {
                    ...existingAttempt,
                    marked_for_review: !currentMarkedStatus,
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
            state.startTime = action.payload;
        },
        setElapsedTime: (state, action: PayloadAction<number>) => {
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
            const attemptsMap: Record<UUID, Omit<QuestionAttempt, 'id' | 'created_at'>> = {};
            
            action.payload.forEach((attempt) => {
                const { id, created_at, ...attemptData } = attempt;
                attemptsMap[attempt.question_id] = attemptData;
            });
            
            state.attempts = attemptsMap;
        },

        // Reset state
        resetDailyPractice: () => initialState,

        // Initialize practice session
        initializeSession: (
            state,
            action: PayloadAction<{
                questionIds: UUID[];
                currentIndex?: number;
                elapsedTime?: number;
            }>
        ) => {
            state.questionOrder = action.payload.questionIds;
            state.currentQuestionIndex = action.payload.currentIndex ?? 0;
            state.startTime = Date.now();
            state.elapsedTimeSeconds = action.payload.elapsedTime ?? 0;
            state.attempts = {};
            state.selectedOption = null;
            state.confidenceLevel = null;
            state.viewMode = 'exam';
            state.solutionViewType = 'common';
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
    [selectAttempts, selectQuestionOrder],
    (attempts, questionOrder) => {
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