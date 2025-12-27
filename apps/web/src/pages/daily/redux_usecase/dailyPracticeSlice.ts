import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { DailyQuestion, UserAttempt } from '../../types';

interface DailyPracticeState {
    // Mode management
    viewMode: 'exam' | 'solution';
    solutionViewType: 'common' | 'personalized';
    
    // RC/VA type
    practiceType: 'rc' | 'va';
    
    // Current question index
    currentQuestionIndex: number;
    
    // All questions in the current practice session
    questions: DailyQuestion[];
    
    // User attempts keyed by question ID
    attempts: Record<string, UserAttempt>;
    
    // Question order (for reordering para jumble)
    questionOrder: string[];
    
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
    practiceType: 'rc',
    currentQuestionIndex: 0,
    questions: [],
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
        
        // Practice type
        setPracticeType: (state, action: PayloadAction<'rc' | 'va'>) => {
            state.practiceType = action.payload;
            state.currentQuestionIndex = 0;
            state.selectedOption = null;
            state.confidenceLevel = null;
        },
        
        // Questions
        setQuestions: (state, action: PayloadAction<DailyQuestion[]>) => {
            state.questions = action.payload;
            state.questionOrder = action.payload.map(q => q.id);
        },
        
        // Navigation
        setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
            state.currentQuestionIndex = action.payload;
            // Reset selected option when changing questions
            const currentQuestion = state.questions[action.payload];
            if (currentQuestion) {
                const attempt = state.attempts[currentQuestion.id];
                state.selectedOption = attempt?.selectedOption ?? null;
                state.confidenceLevel = attempt?.confidenceLevel ?? null;
            } else {
                state.selectedOption = null;
                state.confidenceLevel = null;
            }
        },
        goToNextQuestion: (state) => {
            if (state.currentQuestionIndex < state.questions.length - 1) {
                state.currentQuestionIndex += 1;
                const currentQuestion = state.questions[state.currentQuestionIndex];
                if (currentQuestion) {
                    const attempt = state.attempts[currentQuestion.id];
                    state.selectedOption = attempt?.selectedOption ?? null;
                    state.confidenceLevel = attempt?.confidenceLevel ?? null;
                }
            }
        },
        goToPreviousQuestion: (state) => {
            if (state.currentQuestionIndex > 0) {
                state.currentQuestionIndex -= 1;
                const currentQuestion = state.questions[state.currentQuestionIndex];
                if (currentQuestion) {
                    const attempt = state.attempts[currentQuestion.id];
                    state.selectedOption = attempt?.selectedOption ?? null;
                    state.confidenceLevel = attempt?.confidenceLevel ?? null;
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
        
        // Submit answer
        submitAnswer: (state) => {
            const currentQuestion = state.questions[state.currentQuestionIndex];
            if (!currentQuestion) return;
            
            state.attempts[currentQuestion.id] = {
                questionId: currentQuestion.id,
                selectedOption: state.selectedOption,
                confidenceLevel: state.confidenceLevel ?? 0,
                status: state.selectedOption ? 'answered' : 'skipped',
                timeSpentSeconds: state.startTime 
                    ? Math.floor((Date.now() - state.startTime) / 1000)
                    : undefined,
            };
        },
        
        // Mark for review
        toggleMarkForReview: (state) => {
            const currentQuestion = state.questions[state.currentQuestionIndex];
            if (!currentQuestion) return;
            
            const existingAttempt = state.attempts[currentQuestion.id];
            const currentStatus = existingAttempt?.status;
            
            state.attempts[currentQuestion.id] = {
                ...existingAttempt,
                questionId: currentQuestion.id,
                selectedOption: existingAttempt?.selectedOption ?? state.selectedOption,
                confidenceLevel: existingAttempt?.confidenceLevel ?? state.confidenceLevel ?? 0,
                status: currentStatus === 'marked_for_review' ? 'answered' : 'marked_for_review',
                timeSpentSeconds: existingAttempt?.timeSpentSeconds,
            };
        },
        
        // Update attempt status
        updateAttemptStatus: (state, action: PayloadAction<{ questionId: string; status: 'answered' | 'skipped' | 'marked_for_review' }>) => {
            const { questionId, status } = action.payload;
            const existingAttempt = state.attempts[questionId];
            if (existingAttempt) {
                state.attempts[questionId] = {
                    ...existingAttempt,
                    status,
                };
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
        setQuestionOrder: (state, action: PayloadAction<string[]>) => {
            state.questionOrder = action.payload;
        },
        
        // Reset state
        resetDailyPractice: () => initialState,
        
        // Initialize practice session
        initializeSession: (state, action: PayloadAction<{ type: 'rc' | 'va'; questions: DailyQuestion[] }>) => {
            state.practiceType = action.payload.type;
            state.questions = action.payload.questions;
            state.currentQuestionIndex = 0;
            state.questionOrder = action.payload.questions.map(q => q.id);
            state.startTime = Date.now();
            state.elapsedTimeSeconds = 0;
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
    setPracticeType,
    setQuestions,
    setCurrentQuestionIndex,
    goToNextQuestion,
    goToPreviousQuestion,
    setSelectedOption,
    setConfidenceLevel,
    submitAnswer,
    toggleMarkForReview,
    updateAttemptStatus,
    setStartTime,
    setElapsedTime,
    incrementElapsedTime,
    setIsSubmitting,
    toggleQuestionPalette,
    setQuestionOrder,
    resetDailyPractice,
    initializeSession,
} = dailyPracticeSlice.actions;

// Selectors
export const selectViewMode = (state: { dailyPractice: DailyPracticeState }) => state.dailyPractice.viewMode;
export const selectSolutionViewType = (state: { dailyPractice: DailyPracticeState }) => state.dailyPractice.solutionViewType;
export const selectPracticeType = (state: { dailyPractice: DailyPracticeState }) => state.dailyPractice.practiceType;
export const selectCurrentQuestionIndex = (state: { dailyPractice: DailyPracticeState }) => state.dailyPractice.currentQuestionIndex;
export const selectQuestions = (state: { dailyPractice: DailyPracticeState }) => state.dailyPractice.questions;
export const selectAttempts = (state: { dailyPractice: DailyPracticeState }) => state.dailyPractice.attempts;
export const selectQuestionOrder = (state: { dailyPractice: DailyPracticeState }) => state.dailyPractice.questionOrder;
export const selectStartTime = (state: { dailyPractice: DailyPracticeState }) => state.dailyPractice.startTime;
export const selectElapsedTime = (state: { dailyPractice: DailyPracticeState }) => state.dailyPractice.elapsedTimeSeconds;
export const selectSelectedOption = (state: { dailyPractice: DailyPracticeState }) => state.dailyPractice.selectedOption;
export const selectConfidenceLevel = (state: { dailyPractice: DailyPracticeState }) => state.dailyPractice.confidenceLevel;
export const selectIsSubmitting = (state: { dailyPractice: DailyPracticeState }) => state.dailyPractice.isSubmitting;
export const selectShowQuestionPalette = (state: { dailyPractice: DailyPracticeState }) => state.dailyPractice.showQuestionPalette;

export const selectCurrentQuestion = createSelector(
    [selectQuestions, selectCurrentQuestionIndex],
    (questions, currentIndex) => questions[currentIndex] ?? null
);

export const selectCurrentAttempt = createSelector(
    [selectAttempts, selectCurrentQuestion],
    (attempts, currentQuestion) => currentQuestion ? attempts[currentQuestion.id] ?? null : null
);

export const selectQuestionStatusCounts = createSelector(
    [selectAttempts, selectQuestions],
    (attempts, questions) => {
        const counts = {
            answered: 0,
            skipped: 0,
            marked_for_review: 0,
            not_visited: 0,
        };
        
        const questionIds = new Set(questions.map(q => q.id));
        
        for (const questionId of questionIds) {
            const attempt = attempts[questionId];
            if (attempt) {
                counts[attempt.status as keyof typeof counts] += 1;
            } else {
                counts.not_visited += 1;
            }
        }
        
        return counts;
    }
);

export const selectIsLastQuestion = createSelector(
    [selectCurrentQuestionIndex, selectQuestions],
    (currentIndex, questions) => currentIndex === questions.length - 1
);

export const selectIsFirstQuestion = createSelector(
    [selectCurrentQuestionIndex],
    (currentIndex) => currentIndex === 0
);

export const selectIsQuestionAnswered = createSelector(
    [selectCurrentAttempt],
    (attempt) => attempt?.status === 'answered'
);

export const selectIsQuestionMarkedForReview = createSelector(
    [selectCurrentAttempt],
    (attempt) => attempt?.status === 'marked_for_review'
);

export default dailyPracticeSlice.reducer;
