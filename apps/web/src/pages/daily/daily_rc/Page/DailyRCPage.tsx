import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { useTheme } from "../../../../context/ThemeContext";
import { FloatingNavigation } from "../../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../../ui_components/ThemeToggle";
import { supabase } from "../../../../services/apiClient";

// Redux
import {
    selectViewMode,
    selectCurrentQuestionIndex,
    selectAttempts,
    selectIsLastQuestion,
    selectCurrentQuestionId,
    selectProgressStats,
    selectSession,
    selectElapsedTime,
    selectPendingAttempts,
    initializeSession,
    clearResponse,
    goToNextQuestion,
    goToPreviousQuestion,
    setViewMode,
    incrementElapsedTime,
    resetDailyPractice,
    commitPendingAttempt,
} from "../../redux_usecase/dailyPracticeSlice";

import {
    useFetchDailyTestDataQuery,
    useLazyFetchExistingSessionDetailsQuery,
    useStartDailyRCSessionMutation,
    useSaveSessionDetailsMutation,
    useSaveQuestionAttemptsMutation,
} from "../../redux_usecase/dailyPracticeApi";

import { SplitPaneLayout } from "../Component/SplitPaneLayout";
import { QuestionPalette } from "../../components/QuestionPalette";
import { QuestionPanel } from "../../components/QuestionPanel";
import { DailyRCVAPageSkeleton } from "../../components/DailySkeleton";
import type { Question } from "../../../../types";
import { v4 as uuid4 } from "uuid";
import { useExamNavigationGuard } from "../../navigation_hook/useExamNavigation";

const DailyRCPage: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const [windowWidth, setWindowWidth] = React.useState(
        typeof window !== "undefined" ? window.innerWidth : 1024
    );

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const isMobile = windowWidth < 768;
    const paletteWidth = isMobile ? 288 : 256;

    // --- 1. Data Fetching & Initialization ---

    // Fetch generic daily test data
    const { data: testData, isLoading: isTestDataLoading } =
        useFetchDailyTestDataQuery();

    // Mutations and Lazy Queries
    const [fetchExistingSession, { isFetching: isSessionLoading }] =
        useLazyFetchExistingSessionDetailsQuery();
    const [startNewSession, { isLoading: isCreatingSession }] =
        useStartDailyRCSessionMutation();

    // Saving
    const [saveSession] = useSaveSessionDetailsMutation();
    const [saveAttempts] = useSaveQuestionAttemptsMutation();

    // Redux Selectors
    const viewMode = useSelector(selectViewMode);
    const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
    const attempts = useSelector(selectAttempts);
    const pendingAttempts = useSelector(selectPendingAttempts);
    const currentQuestionId = useSelector(selectCurrentQuestionId);
    const progress = useSelector(selectProgressStats);
    const session = useSelector(selectSession);
    const elapsedTime = useSelector(selectElapsedTime);
    const isLastQuestion = useSelector(selectIsLastQuestion);

    //navigation restricitons
    const allowNavigation = false;
    const shouldBlock =
        !allowNavigation && viewMode === "exam" && Object.keys(attempts).length > 0;

    useExamNavigationGuard(shouldBlock);

    // Derived UI Data
    const questions =
        testData?.questions.filter(
            (q) => q.question_type === "rc_question" || q.passage_id !== null
        ) || [];
    const passages = testData?.passages || [];
    const currentQuestion = questions.find((q) => q.id === currentQuestionId);
    const currentPassage = currentQuestion?.passage_id
        ? passages.find((p) => p.id === currentQuestion.passage_id)
        : null;

    const [showPalette, setShowPalette] = React.useState(true);
    const isLoading = isTestDataLoading || isSessionLoading || isCreatingSession;

    // --- 2. Session Setup Logic ---
    useEffect(() => {
        // Only run if test data is ready and we haven't initialized a session yet
        if (!testData || session.id || isLoading) return;

        const init = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                navigate("/login");
                return;
            }

            // 1. Check for existing session
            const sessionResult = await fetchExistingSession({
                user_id: user.id,
                paper_id: testData.examInfo.id,
                session_type: "daily_challenge_rc",
            });

            // Prepare Question IDs
            const rcQuestions = testData.questions.filter(
                (q: Question) =>
                    q.question_type === "rc_question" || q.passage_id !== null
            );
            const questionIds = rcQuestions.map((q) => q.id);

            if (sessionResult.data) {
                // Resume
                dispatch(
                    initializeSession({
                        session: sessionResult.data.session,
                        questionIds,
                        existingAttempts: sessionResult.data.attempts,
                        elapsedTime: sessionResult.data.session.time_spent_seconds,
                        status: sessionResult.data.session.status,
                    })
                );
            } else {
                // Start New
                const passageIds = Array.from(
                    new Set(rcQuestions.map((q) => q.passage_id).filter(Boolean))
                ) as string[];

                const newSession = await startNewSession({
                    user_id: user.id,
                    paper_id: testData.examInfo.id,
                    passage_ids: passageIds,
                    question_ids: questionIds,
                }).unwrap();

                dispatch(
                    initializeSession({
                        session: newSession,
                        questionIds,
                        elapsedTime: 0,
                    })
                );
            }
        };

        init();
    }, [
        testData,
        session.id,
        dispatch,
        fetchExistingSession,
        isLoading,
        navigate,
        startNewSession,
    ]);

    // --- 3. Timer Logic ---
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (viewMode === "exam" && !isLoading) {
            timer = setInterval(() => dispatch(incrementElapsedTime()), 1000);
        }
        return () => clearInterval(timer);
    }, [viewMode, isLoading, dispatch]);

    // --- 4. Handlers ---

    // A. Backend-First Submission Routine
    const handleFinishExam = useCallback(async () => {
        if (!session.id) return;

        const confirmSubmit = window.confirm(
            `You have answered ${progress.answered}/${questions.length}. Submit?`
        );
        if (!confirmSubmit) return;

        try {
            // 1. Prepare Data
            const attemptList = Object.values(attempts).map((a) => ({
                ...a,
                // Ensure strictly required fields for DB
                id: a.id ? a.id : uuid4(),
                user_id: session.user_id,
                session_id: session.id,
                user_answer: a.user_answer || {},
                marked_for_review: a.marked_for_review || false,
                rationale_viewed: false,
                rationale_helpful: null,
                ai_feedback: null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            })) as any;

            // 2. Perform Backend Calls (Parallelized for speed)
            await Promise.all([
                saveSession({
                    session_id: session.id,
                    status: "completed",
                    completed_at: new Date().toISOString(),
                    time_spent_seconds: elapsedTime,
                    total_questions: questions.length,
                    correct_answers: progress.correct,
                    score_percentage: progress.percentage,
                    current_question_index: currentQuestionIndex,
                }).unwrap(),

                attemptList.length > 0
                    ? saveAttempts({ attempts: attemptList }).unwrap()
                    : Promise.resolve(),
            ]);

            // 3. Update UI Mode ONLY after success
            dispatch(setViewMode("solution"));
        } catch (err) {
            console.error("Failed to submit exam:", err);
            alert("Failed to submit. Please check your connection.");
        }
    }, [
        session.id,
        session.user_id,
        attempts,
        elapsedTime,
        progress,
        questions.length,
        currentQuestionIndex,
        saveSession,
        saveAttempts,
        dispatch,
    ]);

    // B. Navigation Handlers
    const handleSaveAndNext = () => {
        // Commit the current question's pending attempt before navigating
        if (currentQuestion) {
            dispatch(
                commitPendingAttempt({
                    questionId: currentQuestion.id,
                    userId: session.user_id,
                    passageId: currentQuestion.passage_id,
                    markForReview: false,
                })
            );
        }
        if (!isLastQuestion) {
            dispatch(goToNextQuestion());
        } else {
            handleFinishExam();
        }
    };

    const handleMarkForReviewAndNext = () => {
        // Mark current question for review and move to next
        if (currentQuestion) {
            dispatch(
                commitPendingAttempt({
                    questionId: currentQuestion.id,
                    userId: session.user_id,
                    passageId: currentQuestion.passage_id,
                    markForReview: true,
                })
            );
        }
        if (!isLastQuestion) {
            dispatch(goToNextQuestion());
        } else {
            handleFinishExam();
        }
    };

    // Helper to clear resources
    useEffect(() => {
        return () => {
            dispatch(resetDailyPractice());
        };
    }, [dispatch]);

    //Just to check the updated attempts on each change if happenning or not
    useEffect(() => {
        console.log(
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%changes in attempts%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%"
        );
        console.log(attempts);
    }, [attempts]);

    // --- 5. Render ---
    if (isLoading || !currentQuestion) {
        return <DailyRCVAPageSkeleton isRC={true} />;
    }

    return (
        <div
            className={`h-screen flex flex-col ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
                }`}
        >
            <FloatingThemeToggle />
            <FloatingNavigation />

            {/* Header */}
            <header
                className={`shrink-0 h-16 z-30 flex items-center justify-between px-4 md:px-6 border-b backdrop-blur-xl ${isDark
                    ? "bg-bg-primary-dark/90 border-border-dark"
                    : "bg-bg-primary-light/90 border-border-light"
                    }`}
            >
                <h1
                    className={`font-serif font-bold text-lg md:text-xl ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}
                >
                    <span className="hidden sm:inline">
                        {testData?.examInfo.name || "Daily Practice"}:{" "}
                    </span>
                    RC
                </h1>
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-20 md:w-32 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{
                                width: `${(progress.answered / questions.length) * 100}%`,
                            }}
                        />
                    </div>
                    <span
                        className={`text-sm ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                            }`}
                    >
                        {progress.answered}/{questions.length}
                    </span>
                </div>
            </header>

            {/* Main Body */}
            <div className="flex-1 flex relative overflow-hidden">
                <div className="flex-1 h-full overflow-hidden">
                    <SplitPaneLayout
                        isDark={isDark}
                        passage={currentPassage}
                        showPassage={!!currentPassage}
                        isExamMode={viewMode === "exam"}
                    >
                        <QuestionPanel
                            question={currentQuestion}
                            isDark={isDark}
                        // Pass down handlers that dispatch to Redux
                        />
                    </SplitPaneLayout>
                </div>

                {/* Palette Toggle Button */}
                <motion.button
                    onClick={() => setShowPalette(!showPalette)}
                    className={`
        absolute top-1/2 -translate-y-1/2 z-60
        w-8 h-16 rounded-l-lg border border-r-0
        transition-all duration-300 flex items-center justify-center
        ${isDark
                            ? "bg-bg-secondary-dark border-border-dark hover:bg-bg-tertiary-dark"
                            : "bg-bg-secondary-light border-border-light hover:bg-bg-tertiary-light"
                        }
    `}
                    // Move the positional logic here for an instant jump
                    style={{ right: showPalette ? paletteWidth : 0 }}

                    // Keep these for the interaction feel
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {showPalette ? (
                        <MdChevronRight
                            className={`w-5 h-5 ${isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                                }`}
                        />
                    ) : (
                        <MdChevronLeft
                            className={`w-5 h-5 ${isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                                }`}
                        />
                    )}
                </motion.button>

                {/* Palette Drawer */}
                <AnimatePresence>
                    {showPalette && (
                        <motion.div
                            initial={{ x: 300 }}
                            animate={{ x: 0 }}
                            exit={{ x: 300 }}
                            className={`
                                fixed md:relative inset-y-0 right-0 z-50 md:z-auto
                                w-72 md:w-64 border-l overflow-y-auto shadow-2xl md:shadow-none
                                ${isDark
                                    ? "bg-bg-secondary-dark border-border-dark"
                                    : "bg-bg-secondary-light border-border-light"
                                }
                            `}
                        >
                            <QuestionPalette
                                questions={questions}
                                attempts={attempts}
                                pendingAttempts={pendingAttempts}
                                isDark={isDark}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <footer
                className={`shrink-0 min-h-20 md:h-20 border-t flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 md:py-0 backdrop-blur-xl z-30 gap-4 ${isDark
                    ? "bg-bg-primary-dark/90 border-border-dark"
                    : "bg-bg-primary-light/90 border-border-light"
                    }`}
            >
                {viewMode === "exam" ? (
                    <>
                        <div className="flex gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-start">
                            <button
                                onClick={() => dispatch(clearResponse())}
                                className={`
                                        flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium text-sm md:text-base transition-all duration-200
                                        ${isDark
                                        ? "bg-brand-primary-dark text-white hover:scale-105"
                                        : "bg-brand-primary-light text-white hover:scale-105"
                                    }
                                    `}
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleMarkForReviewAndNext}
                                className={`
                                        flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium text-sm md:text-base transition-all duration-200
                                        ${isDark
                                        ? "bg-brand-primary-dark text-white hover:scale-105"
                                        : "bg-brand-primary-light text-white hover:scale-105"
                                    }
                                    `}
                            >
                                Mark for Review
                            </button>
                        </div>
                        <div className="flex gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end">
                            <button
                                onClick={handleSaveAndNext}
                                className={`
                                        flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium text-sm md:text-base transition-all duration-200
                                        ${isDark
                                        ? "bg-brand-primary-dark text-white hover:scale-105"
                                        : "bg-brand-primary-light text-white hover:scale-105"
                                    }
                                    `}
                            >
                                {isLastQuestion ? "Finish" : "Save & Next"}
                            </button>
                            <button
                                onClick={handleFinishExam}
                                className="px-4 md:px-6 py-2 md:py-3 bg-green-600 text-white rounded-xl font-medium text-sm md:text-base hover:scale-105 transition-all duration-200"
                            >
                                Submit
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex gap-4 w-full justify-center">
                        <button
                            onClick={() => dispatch(goToPreviousQuestion())}
                            className={`px-6 py-2 border rounded-lg ${isDark ? "border-border-dark text-text-primary-dark" : "border-border-light text-text-primary-light"}`}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => dispatch(goToNextQuestion())}
                            className={`px-6 py-2 border rounded-lg ${isDark ? "border-border-dark text-text-primary-dark" : "border-border-light text-text-primary-light"}`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </footer>
        </div>
    );
};

export default DailyRCPage;
