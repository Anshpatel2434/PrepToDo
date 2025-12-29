import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { MdArrowBack, MdArrowForward } from "react-icons/md";
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
    incrementElapsedTime,
    clearResponse,
    toggleMarkForReview,
    submitAnswer,
    initializeSession,
} from "../../redux_usecase/dailyPracticeSlice";
import { dailyRCData } from "../../mock_data/dailyMockData";
import { SplitPaneLayout } from "../Component/SplitPaneLayout";
import { QuestionPalette } from "../../components/QuestionPalette";
import { QuestionPanel } from "../../components/QuestionPanel";

const DailyRCPage: React.FC = () => {
    const dispatch = useDispatch();
    const { isDark } = useTheme();

    // Local state
    const [isLoading, setIsLoading] = useState(true);
    const [showPalette, setShowPalette] = useState(true);

    // Redux state
    const viewMode = useSelector(selectViewMode);
    const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
    const attempts = useSelector(selectAttempts);
    const isFirstQuestion = useSelector(selectIsFirstQuestion);
    const isLastQuestion = useSelector(selectIsLastQuestion);
    const elapsedTime = useSelector(selectElapsedTime);

    // Use mock data for questions
    const questions = dailyRCData.questions;
    const passage = dailyRCData.passage;
    const currentQuestion = questions[currentQuestionIndex];

    // Helper function to get attempt status
    const getAttemptStatus = (questionId: string): 'answered' | 'marked_for_review' | 'not_visited' => {
        const attempt = attempts[questionId];
        if (!attempt) return 'not_visited';
        if (attempt.marked_for_review) return 'marked_for_review';
        const userAnswer = attempt.user_answer as any;
        if (userAnswer?.user_answer != null) return 'answered';
        return 'not_visited';
    };

    // Initialize session
    useEffect(() => {
        const initSession = async () => {
            setIsLoading(true);

            // Simulate data loading
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Initialize Redux with RC question IDs
            const questionIds = dailyRCData.questions.map((q) => q.id);
            dispatch(initializeSession({
                questionIds,
                currentIndex: 0,
                elapsedTime: 0,
            }));

            setIsLoading(false);
        };

        initSession();
    }, [dispatch]);

    // Timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            dispatch(incrementElapsedTime());
        }, 1000);

        return () => clearInterval(timer);
    }, [dispatch]);

    // Save state before closing tab
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Save current state to localStorage
            const state = {
                attempts,
                currentQuestionIndex,
                elapsedTime,
                viewMode,
            };
            localStorage.setItem('dailyPracticeState_RC', JSON.stringify(state));
            
            // TODO: Make API call to save attempts to database
            // This would use the saveSessionDetails and saveQuestionAttempts mutations
            
            // Show confirmation if user has unsaved progress
            if (viewMode === 'exam' && Object.keys(attempts).length > 0) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [attempts, currentQuestionIndex, elapsedTime, viewMode]);

    // Handle navigation
    const handleNextQuestion = useCallback(() => {
        if (!isLastQuestion) {
            dispatch(goToNextQuestion());
        } else {
            // Show submit confirmation
            const answeredCount = Object.values(attempts).filter(
                (a) => {
                    const userAnswer = a.user_answer as any;
                    return userAnswer?.user_answer != null;
                }
            ).length;
            if (answeredCount < questions.length) {
                if (
                    window.confirm(
                        `You have ${answeredCount} of ${questions.length} questions answered. Submit anyway?`
                    )
                ) {
                    dispatch(setViewMode("solution"));
                }
            } else {
                dispatch(setViewMode("solution"));
            }
        }
    }, [dispatch, isLastQuestion, attempts, questions.length]);

    const handlePreviousQuestion = useCallback(() => {
        if (!isFirstQuestion) {
            dispatch(goToPreviousQuestion());
        }
    }, [dispatch, isFirstQuestion]);

    const handleQuestionClick = useCallback(
        (index: number) => {
            dispatch({
                type: "dailyPractice/setCurrentQuestionIndex",
                payload: index,
            });
        },
        [dispatch]
    );

    const handleToggleViewMode = useCallback(() => {
        dispatch(setViewMode(viewMode === "exam" ? "solution" : "exam"));
    }, [dispatch, viewMode]);

    // Get passage content for current question
    const getPassageContent = useCallback(() => {
        if (!currentQuestion) return null;
        if (currentQuestion.passageId === passage.id) {
            return passage;
        }
        return passage;
    }, [currentQuestion, passage]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    // Calculate progress
    const answeredCount = Object.values(attempts).filter(
        (a) => {
            const userAnswer = a.user_answer as any;
            return userAnswer?.user_answer != null;
        }
    ).length;
    const progress = (answeredCount / questions.length) * 100;

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
                            Loading Daily RC Practice...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const isExamMode = viewMode === "exam";

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
                            Daily Practice: RC
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

                    {/* Center: Timer (hidden in solution mode) */}
                    {isExamMode && (
                        <div
                            className={`
                            px-4 py-2 rounded-lg font-mono text-lg
                            ${
                                                            isDark
                                                                ? "bg-bg-tertiary-dark text-text-primary-dark"
                                                                : "bg-bg-tertiary-light text-text-primary-light"
                                                        }
                        `}
                        >
                            {formatTime(elapsedTime)}
                        </div>
                    )}

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        {/* Toggle Palette */}
                        <motion.button
                            onClick={() => setShowPalette(!showPalette)}
                            className={`
                                p-2 rounded-lg border transition-colors
                                ${
                                                                    isDark
                                                                        ? "border-border-dark hover:bg-bg-tertiary-dark"
                                                                        : "border-border-light hover:bg-bg-tertiary-light"
                                                                }
                            `}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
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
                                {showPalette ? "Hide" : "Show"} Palette
                            </span>
                        </motion.button>

                        {/* View Mode Toggle */}
                        <motion.button
                            onClick={handleToggleViewMode}
                            className={`
                                px-4 py-2 rounded-lg font-medium transition-colors
                                ${
                                                                    isDark
                                                                        ? "bg-brand-primary-dark text-white hover:bg-brand-primary-hover-dark"
                                                                        : "bg-brand-primary-light text-white hover:bg-brand-primary-hover-light"
                                                                }
                            `}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isExamMode ? "View Solutions" : "Back to Exam"}
                        </motion.button>
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <div className="pt-16 h-screen flex overflow-hidden">
                {/* Split Pane Layout */}
                <div className="flex-1 h-full overflow-hidden transition-all duration-300">
                    <SplitPaneLayout
                        isDark={isDark}
                        passage={getPassageContent()}
                        showPassage={true}
                        isExamMode={isExamMode}
                    >
                        {/* Question Panel */}
                        <QuestionPanel
                            question={currentQuestion!}
                            isDark={isDark}
                        />
                    </SplitPaneLayout>
                </div>

                {/* Question Palette (Right Sidebar) */}
                <AnimatePresence>
                    {showPalette && <QuestionPalette isDark={isDark} />}
                </AnimatePresence>
            </div>

            {/* Bottom Navigation Footer */}
            <motion.footer
                className={`
                        fixed bottom-0 left-0 right-0 z-30
                        backdrop-blur-xl border-t
                        ${
                                            isDark
                                                ? "bg-bg-primary-dark/90 border-border-dark"
                                                : "bg-bg-primary-light/90 border-border-light"
                                        }
                    `}
                initial={{ y: 60 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {isExamMode ? (
                    // Exam Mode Footer
                    <div className="px-6 py-4 flex items-center justify-between">
                        {/* Left Section: Mark for Review and Next + Clear Response */}
                        <div className="flex items-center gap-3">
                            <motion.button
                                onClick={() => {
                                    dispatch(toggleMarkForReview({
                                        user_id: 'user-id', // TODO: Get from auth context
                                        session_id: 'session-id', // TODO: Get from session
                                        passage_id: currentQuestion?.passageId ?? null,
                                    }));
                                    if (!isLastQuestion) {
                                        dispatch(goToNextQuestion());
                                    }
                                }}
                                className={`
                                    flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium border-2
                                    transition-all duration-200
                                    ${
                                        isDark
                                            ? "border-brand-primary-dark text-brand-primary-dark hover:bg-brand-primary-dark/10"
                                            : "border-brand-primary-light text-brand-primary-light hover:bg-brand-primary-light/10"
                                    }
                                `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Mark for Review & Next
                            </motion.button>
                            <motion.button
                                onClick={() => dispatch(clearResponse())}
                                className={`
                                    px-4 py-2.5 rounded-lg font-medium border
                                    transition-all duration-200
                                    ${
                                        isDark
                                            ? "border-border-dark text-text-secondary-dark hover:bg-bg-tertiary-dark"
                                            : "border-border-light text-text-secondary-light hover:bg-bg-tertiary-light"
                                    }
                                `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Clear Response
                            </motion.button>
                        </div>

                        {/* Right Section: Save and Next + Submit */}
                        <div className="flex items-center gap-3">
                            <motion.button
                                onClick={() => {
                                    dispatch(submitAnswer({
                                        user_id: 'user-id', // TODO: Get from auth context
                                        session_id: 'session-id', // TODO: Get from session
                                        passage_id: currentQuestion?.passageId ?? null,
                                        correct_answer: currentQuestion?.correctAnswer,
                                    }));
                                    if (!isLastQuestion) {
                                        dispatch(goToNextQuestion());
                                    }
                                }}
                                disabled={isLastQuestion}
                                className={`
                                    flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium
                                    transition-all duration-200
                                    ${
                                        isLastQuestion
                                            ? "opacity-50 cursor-not-allowed"
                                            : isDark
                                            ? "bg-bg-tertiary-dark text-text-primary-dark hover:bg-bg-secondary-dark"
                                            : "bg-bg-tertiary-light text-text-primary-light hover:bg-bg-secondary-light"
                                    }
                                `}
                                whileHover={!isLastQuestion ? { scale: 1.02 } : {}}
                                whileTap={!isLastQuestion ? { scale: 0.98 } : {}}
                            >
                                Save & Next
                                <MdArrowForward className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                                onClick={handleToggleViewMode}
                                className={`
                                    px-6 py-2.5 rounded-lg font-medium text-white
                                    transition-all duration-200
                                    ${
                                        isDark
                                            ? "bg-brand-primary-dark hover:bg-brand-primary-hover-dark"
                                            : "bg-brand-primary-light hover:bg-brand-primary-hover-light"
                                    }
                                `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Submit
                            </motion.button>
                        </div>
                    </div>
                ) : (
                    // Solution Mode Footer
                    <div className="px-6 py-4 flex items-center justify-between">
                        {/* Left: Previous Button */}
                        <motion.button
                            onClick={handlePreviousQuestion}
                            disabled={isFirstQuestion}
                            className={`
                                flex items-center gap-2 px-6 py-3 rounded-xl font-medium
                                transition-all duration-200
                                ${
                                    isFirstQuestion
                                        ? "opacity-50 cursor-not-allowed"
                                        : isDark
                                        ? "bg-bg-tertiary-dark text-text-primary-dark hover:bg-bg-secondary-dark"
                                        : "bg-bg-tertiary-light text-text-primary-light hover:bg-bg-secondary-light"
                                }
                            `}
                            whileHover={!isFirstQuestion ? { scale: 1.02 } : {}}
                            whileTap={!isFirstQuestion ? { scale: 0.98 } : {}}
                        >
                            <MdArrowBack className="w-5 h-5" />
                            Previous
                        </motion.button>

                        {/* Center: Question Indicator */}
                        <div className="flex items-center gap-2">
                            {questions.map((q, index) => {
                                const status = getAttemptStatus(q.id);
                                return (
                                    <motion.button
                                        key={q.id}
                                        onClick={() => handleQuestionClick(index)}
                                        className={`
                                            w-10 h-10 rounded-lg font-medium text-sm
                                            transition-all duration-200
                                            ${
                                                index === currentQuestionIndex
                                                    ? isDark
                                                        ? "bg-brand-primary-dark text-white"
                                                        : "bg-brand-primary-light text-white"
                                                    : status === "answered"
                                                    ? isDark
                                                        ? "bg-success/80 text-white"
                                                        : "bg-success text-white"
                                                    : status === "marked_for_review"
                                                    ? isDark
                                                        ? "bg-info/80 text-white"
                                                        : "bg-info text-white"
                                                    : isDark
                                                    ? "bg-bg-tertiary-dark text-text-muted-dark"
                                                    : "bg-bg-tertiary-light text-text-muted-light"
                                            }
                                        `}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {index + 1}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Right: Next Button */}
                        <motion.button
                            onClick={handleNextQuestion}
                            disabled={isLastQuestion}
                            className={`
                                flex items-center gap-2 px-6 py-3 rounded-xl font-medium
                                transition-all duration-200
                                ${
                                    isLastQuestion
                                        ? "opacity-50 cursor-not-allowed"
                                        : isDark
                                        ? "bg-brand-primary-dark text-white hover:bg-brand-primary-hover-dark"
                                        : "bg-brand-primary-light text-white hover:bg-brand-primary-hover-light"
                                }
                            `}
                            whileHover={!isLastQuestion ? { scale: 1.02 } : {}}
                            whileTap={!isLastQuestion ? { scale: 0.98 } : {}}
                        >
                            Next
                            <MdArrowForward className="w-5 h-5" />
                        </motion.button>
                    </div>
                )}
            </motion.footer>
        </div>
    );
};

export default DailyRCPage;
