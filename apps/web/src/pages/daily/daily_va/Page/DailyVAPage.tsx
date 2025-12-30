import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { useTheme } from "../../../../context/ThemeContext";
import { FloatingNavigation } from "../../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../../ui_components/ThemeToggle";
import {
    selectViewMode,
    selectCurrentQuestionIndex,
    selectAttempts,
    selectIsFirstQuestion,
    selectIsLastQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    setViewMode,
    selectElapsedTime,
    selectStartTime,
    incrementElapsedTime,
    clearResponse,
    toggleMarkForReview,
    submitAnswer,
    initializeSession,
    initializeSessionWithAttempts,
    setStartTime,
    selectSelectedOption,
} from "../../redux_usecase/dailyPracticeSlice";
import { QuestionPalette } from "../../components/QuestionPalette";
import { QuestionPanel } from "../../components/QuestionPanel";
import type { Question, QuestionAttempt, UUID } from "../../../../types";
import { useSaveSessionDetailsMutation, useSaveQuestionAttemptsMutation } from "../../redux_usecase/dailyPracticeApi";

const DailyVAPage: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark } = useTheme();

    // Get session data from location state
    const { sessionId, testData, existingAttempts } = location.state || {};

    // UI state only (questions come from testData)
    const [isLoading, setIsLoading] = useState(true);
    const [showPalette, setShowPalette] = useState(true);

    // Derived state from testData (immutable during session)
    const questions: Question[] = testData?.questions.filter((q: Question) =>
        q.passage_id === null && q.question_type !== 'rc_question'
    ) || [];

    const currentQuestion = questions[currentQuestionIndex];

    // Initialize session
    useEffect(() => {
        const initSession = async () => {
            console.log('[DailyVAPage] Initializing VA session');
            setIsLoading(true);

            if (!testData || !sessionId) {
                console.error('[DailyVAPage] No test data or session ID');
                navigate('/daily');
                return;
            }

            console.log('[DailyVAPage] Session ID:', sessionId);
            console.log('[DailyVAPage] Total VA questions:', questions.length);

            // Initialize Redux with question IDs and existing attempts if available
            const questionIds = questions.map((q: Question) => q.id);

            if (existingAttempts && existingAttempts.length > 0) {
                // Transform existing attempts to format expected by Redux
                console.log('[DailyVAPage] Loading existing attempts:', existingAttempts.length);
                const transformedAttempts: Record<UUID, Omit<QuestionAttempt, 'id' | 'created_at'>> = {};
                existingAttempts.forEach((attempt: QuestionAttempt) => {
                    const { id, created_at, ...attemptData } = attempt;
                    transformedAttempts[attempt.question_id] = attemptData;
                });

                dispatch(initializeSessionWithAttempts({
                    questionIds,
                    currentIndex: 0,
                    elapsedTime: 0,
                    attempts: transformedAttempts,
                }));
            } else {
                console.log('[DailyVAPage] No existing attempts, initializing fresh session');
                dispatch(initializeSession({
                    questionIds,
                    currentIndex: 0,
                    elapsedTime: 0,
                }));
            }

            // Set start time
            dispatch(setStartTime(Date.now()));

            setIsLoading(false);
        };

        initSession();
    }, [dispatch, testData, sessionId, navigate, questions, existingAttempts]);

    // Handle save progress
    const handleSaveProgress = useCallback(async () => {
        console.log('[DailyVAPage] handleSaveProgress called');
        if (!sessionId) {
            console.error('[DailyVAPage] No session ID');
            return;
        }

        try {
            // Calculate stats from attempts (QuestionAttempt type)
            const answeredCount = Object.values(attempts).filter(
                (a) => {
                    const userAnswer = a.user_answer as any;
                    return userAnswer?.user_answer != null;
                }
            ).length;
            const correctCount = Object.values(attempts).filter(a => a.is_correct).length;
            const scorePercentage = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

            console.log('[DailyVAPage] Saving session - Questions:', questions.length, 'Answered:', answeredCount, 'Correct:', correctCount, 'Score:', scorePercentage);

            // Save session details
            await saveSessionDetails({
                session_id: sessionId,
                time_spent_seconds: elapsedTime,
                status: viewMode === 'solution' ? 'completed' : 'in_progress',
                total_questions: questions.length,
                correct_answers: correctCount,
                score_percentage: scorePercentage,
                current_question_index: currentQuestionIndex,
                ...(viewMode === 'solution' && { completed_at: new Date().toISOString() }),
            });

            // Save question attempts
            if (Object.keys(attempts).length > 0) {
                const attemptsToSave = Object.values(attempts).map((attempt) => ({
                    ...attempt,
                    // Add missing required fields for database
                    user_answer: attempt.user_answer as any,
                    marked_for_review: attempt.marked_for_review ?? false,
                    rationale_viewed: attempt.rationale_viewed ?? false,
                    rationale_helpful: attempt.rationale_helpful ?? null,
                    ai_feedback: attempt.ai_feedback ?? null,
                }));
                await saveQuestionAttempts({
                    attempts: attemptsToSave,
                });
            }

            console.log('[DailyVAPage] Progress saved successfully');
        } catch (error) {
            console.error('[DailyVAPage] Error saving progress:', error);
        }
    }, [sessionId, attempts, elapsedTime, viewMode, currentQuestionIndex, questions.length, saveSessionDetails, saveQuestionAttempts]);

    // Timer effect
    useEffect(() => {
        if (viewMode === 'exam' && !isLoading) {
            console.log('[DailyVAPage] Starting timer');
            const timer = setInterval(() => {
                dispatch(incrementElapsedTime());
            }, 1000);

            return () => {
                console.log('[DailyVAPage] Stopping timer');
                clearInterval(timer);
            };
        }
    }, [dispatch, viewMode, isLoading]);

    // Save state before closing tab
    useEffect(() => {
        const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
            // Save current state
            if (viewMode === 'exam' && Object.keys(attempts).length > 0) {
                console.log('[DailyVAPage] User is leaving page, saving progress');
                e.preventDefault();
                e.returnValue = '';

                // Save session and attempts
                await handleSaveProgress();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [attempts, viewMode, handleSaveProgress]);

    // Handle submit session
    const handleSubmitSession = useCallback(async () => {
        console.log('[DailyVAPage] Submitting session');
        await handleSaveProgress();
        dispatch(setViewMode('solution'));
    }, [handleSaveProgress, dispatch]);

    // Handle save and next
    const handleSaveAndNext = useCallback(async () => {
        if (!currentQuestion || !sessionId) {
            console.error('[DailyVAPage] No current question or session ID');
            return;
        }

        // Determine correct answer from question data
        const correctAnswer = currentQuestion.correct_answer;
        console.log('[DailyVAPage] Saving answer for question:', currentQuestion.id);

        // Update attempt in Redux
        dispatch(submitAnswer({
            user_id: 'user-id', // Will be replaced with actual user ID
            session_id: sessionId,
            passage_id: null,
            correct_answer: correctAnswer,
        }));

        // Reset start time for next question
        dispatch(setStartTime(Date.now()));

        // Move to next question
        if (!isLastQuestion) {
            dispatch(goToNextQuestion());
        } else {
            // All questions answered, show completion confirmation
            const answeredCount = Object.values(attempts).filter(
                (a) => {
                    const userAnswer = a.user_answer as any;
                    return userAnswer?.user_answer != null;
                }
            ).length + 1; // +1 for current question

            if (window.confirm(`You have completed ${answeredCount} of ${questions.length} questions. Submit for review?`)) {
                await handleSubmitSession();
            }
        }
    }, [dispatch, currentQuestion, sessionId, isLastQuestion, attempts, questions.length, handleSubmitSession]);

    // Handle mark for review and next
    const handleMarkAndNext = useCallback(() => {
        if (!currentQuestion || !sessionId) {
            console.error('[DailyVAPage] No current question or session ID');
            return;
        }

        console.log('[DailyVAPage] Marking question for review:', currentQuestion.id);

        dispatch(toggleMarkForReview({
            user_id: 'user-id',
            session_id: sessionId,
            passage_id: null,
        }));

        // Reset start time for next question
        dispatch(setStartTime(Date.now()));

        if (!isLastQuestion) {
            dispatch(goToNextQuestion());
        }
    }, [dispatch, currentQuestion, sessionId, isLastQuestion]);

    const handlePreviousQuestion = useCallback(() => {
        console.log('[DailyVAPage] Going to previous question');
        if (!isFirstQuestion) {
            dispatch(goToPreviousQuestion());
        }
    }, [dispatch, isFirstQuestion]);

    const handleNextQuestion = useCallback(() => {
        console.log('[DailyVAPage] Going to next question');
        if (!isLastQuestion) {
            dispatch(goToNextQuestion());
        }
    }, [dispatch, isLastQuestion]);

    const handleClearResponse = useCallback(() => {
        console.log('[DailyVAPage] Clearing response');
        dispatch(clearResponse());
    }, [dispatch]);

    // Calculate progress
    const answeredCount = Object.values(attempts).filter(
        (a) => {
            const userAnswer = a.user_answer as any;
            return userAnswer?.user_answer != null;
        }
    ).length;
    const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    if (isLoading) {
        return (
            <div
                className={`min-h-screen ${
                    isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
                }`}
            >
                <FloatingThemeToggle />
                <FloatingNavigation />
                <div className="flex items-center justify-center h-screen">
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className={`
                                w-16 h-16 rounded-full border-4 animate-spin
                                ${
                                    isDark
                                        ? "border-brand-primary-dark border-t-transparent"
                                        : "border-brand-primary-light border-t-transparent"
                                }
                            `}
                        />
                        <p
                            className={
                                isDark
                                    ? "text-text-secondary-dark"
                                    : "text-text-secondary-light"
                            }
                        >
                            Loading Daily VA Practice...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const isExamMode = viewMode === 'exam';

    return (
        <div
            className={`min-h-screen ${
                isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
            }`}
        >
            <FloatingThemeToggle />
            <FloatingNavigation />

            {/* Top Header */}
            <motion.header
                className={`
                    fixed top-0 left-0 right-0 z-30 h-16
                    backdrop-blur-xl border-b
                    ${
                        isDark
                            ? "bg-bg-primary-dark/90 border-border-dark"
                            : "bg-bg-primary-light/90 border-border-light"
                    }
                `}
                initial={{ y: -60 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="h-full px-6 flex items-center justify-between">
                    {/* Left: Title and Progress */}
                    <div className="flex items-center gap-6">
                        <h1
                            className={`
                                font-serif font-bold text-xl
                                ${
                                    isDark
                                        ? "text-text-primary-dark"
                                        : "text-text-primary-light"
                                }
                            `}
                        >
                            Daily Practice: VA
                        </h1>

                        {/* Progress Bar */}
                        <div className="hidden md:flex items-center gap-3">
                            <div
                                className={`
                                    w-32 h-2 rounded-full overflow-hidden
                                    ${
                                        isDark
                                            ? "bg-bg-tertiary-dark"
                                            : "bg-bg-tertiary-light"
                                    }
                                `}
                            >
                                <motion.div
                                    className={`h-full ${
                                        isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            <span
                                className={`
                                    text-sm font-medium
                                    ${
                                        isDark
                                            ? "text-text-secondary-dark"
                                            : "text-text-secondary-light"
                                    }
                                `}
                            >
                                {answeredCount}/{questions.length}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <div className="pt-16 h-screen flex overflow-hidden relative">
                {/* Question Panel - Full width without passage */}
                <div
                    className={`
                        flex-1 h-full overflow-hidden
                        transition-all duration-300
                        ${showPalette ? 'mr-64' : 'mr-0'}
                    `}
                >
                    <div className="max-w-4xl mx-auto p-6 h-full overflow-y-auto">
                        {currentQuestion && (
                            <QuestionPanel question={currentQuestion} isDark={isDark} />
                        )}
                    </div>
                </div>

                {/* Palette Toggle Button */}
                <motion.button
                    onClick={() => setShowPalette(!showPalette)}
                    className={`
                        absolute top-1/2 -translate-y-1/2 z-40
                        w-8 h-16 rounded-l-lg border border-r-0
                        transition-all duration-300
                        ${
                            isDark
                                ? "bg-bg-secondary-dark border-border-dark hover:bg-bg-tertiary-dark"
                                : "bg-bg-secondary-light border-border-light hover:bg-bg-tertiary-light"
                        }
                    `}
                    style={{ right: showPalette ? '256px' : '0' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {showPalette ? (
                        <MdChevronRight className={`w-5 h-5 mx-auto ${
                            isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'
                        }`} />
                    ) : (
                        <MdChevronLeft className={`w-5 h-5 mx-auto ${
                            isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'
                        }`} />
                    )}
                </motion.button>

                {/* Question Palette (Right Sidebar) */}
                <AnimatePresence>
                    {showPalette && (
                        <motion.div
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`
                                w-64 h-full border-l overflow-y-auto
                                ${
                                    isDark
                                        ? "bg-bg-secondary-dark border-border-dark scrollbar-dark"
                                        : "bg-bg-secondary-light border-border-light scrollbar-light"
                                }
                            `}
                        >
                            <QuestionPalette
                                questions={questions}
                                attempts={attempts}
                                isDark={isDark}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <motion.footer
                    className={`
                        fixed bottom-0 left-0 right-0 z-30 h-20
                        backdrop-blur-xl border-t flex items-center justify-between px-6
                        ${
                            isDark
                                ? "bg-bg-primary-dark/90 border-border-dark"
                                : "bg-bg-primary-light/90 border-border-light"
                        }
                    `}
                    initial={{ y: 80 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {isExamMode ? (
                        <>
                            {/* Left Section */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleMarkAndNext}
                                    className={`
                                        px-6 py-3 rounded-xl border-2 font-medium transition-all duration-200
                                        ${
                                            isDark
                                                ? "border-brand-primary-dark text-brand-primary-dark hover:bg-brand-primary-dark/10"
                                                : "border-brand-primary-light text-brand-primary-light hover:bg-brand-primary-light/10"
                                        }
                                    `}
                                >
                                    Mark for Review & Next
                                </button>
                                <button
                                    onClick={handleClearResponse}
                                    className={`
                                        px-6 py-3 rounded-xl border-2 font-medium transition-all duration-200
                                        ${
                                            isDark
                                                ? "border-border-dark text-text-secondary-dark hover:border-brand-primary-dark hover:text-brand-primary-dark"
                                                : "border-border-light text-text-secondary-light hover:border-brand-primary-light hover:text-brand-primary-light"
                                        }
                                    `}
                                >
                                    Clear Response
                                </button>
                            </div>

                            {/* Right Section */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSaveAndNext}
                                    disabled={!selectedOption}
                                    className={`
                                        px-6 py-3 rounded-xl font-medium transition-all duration-200
                                        ${
                                            selectedOption
                                                ? isDark
                                                    ? "bg-brand-primary-dark text-white hover:scale-105"
                                                    : "bg-brand-primary-light text-white hover:scale-105"
                                                : isDark
                                                ? "bg-bg-tertiary-dark text-text-muted-dark cursor-not-allowed"
                                                : "bg-bg-tertiary-light text-text-muted-light cursor-not-allowed"
                                        }
                                    `}
                                >
                                    Save & Next
                                </button>
                                <button
                                    onClick={handleSubmitSession}
                                    className={`
                                        px-6 py-3 rounded-xl font-medium text-white transition-all duration-200
                                        ${
                                            isDark
                                                ? "bg-success hover:scale-105"
                                                : "bg-success hover:scale-105"
                                        }
                                    `}
                                >
                                    Submit
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Solution Mode Footer */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handlePreviousQuestion}
                                    disabled={isFirstQuestion}
                                    className={`
                                        px-6 py-3 rounded-xl border-2 font-medium transition-all duration-200
                                        ${
                                            !isFirstQuestion
                                                ? isDark
                                                    ? "border-border-dark text-text-secondary-dark hover:border-brand-primary-dark hover:text-brand-primary-dark"
                                                    : "border-border-light text-text-secondary-light hover:border-brand-primary-light hover:text-brand-primary-light"
                                                : isDark
                                                ? "border-border-dark text-text-muted-dark cursor-not-allowed"
                                                : "border-border-light text-text-muted-light cursor-not-allowed"
                                        }
                                    `}
                                >
                                    Previous
                                </button>
                                <span
                                    className={`
                                        px-4 py-2 rounded-lg
                                        ${
                                            isDark
                                                ? "bg-bg-tertiary-dark text-text-secondary-dark"
                                                : "bg-bg-tertiary-light text-text-secondary-light"
                                        }
                                    `}
                                >
                                    {currentQuestionIndex + 1} / {questions.length}
                                </span>
                                <button
                                    onClick={handleNextQuestion}
                                    disabled={isLastQuestion}
                                    className={`
                                        px-6 py-3 rounded-xl border-2 font-medium transition-all duration-200
                                        ${
                                            !isLastQuestion
                                                ? isDark
                                                    ? "border-border-dark text-text-secondary-dark hover:border-brand-primary-dark hover:text-brand-primary-dark"
                                                    : "border-border-light text-text-secondary-light hover:border-brand-primary-light hover:text-brand-primary-light"
                                                : isDark
                                                ? "border-border-dark text-text-muted-dark cursor-not-allowed"
                                                : "border-border-light text-text-muted-light cursor-not-allowed"
                                        }
                                    `}
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}
                </motion.footer>
            </div>
        </div>
    );
};

export default DailyVAPage;
