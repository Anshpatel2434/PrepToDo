import React, { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../../context/ThemeContext";
import { supabase } from "../../../../services/apiClient";
import { QuestionPalette } from "../../components/QuestionPalette";
import { QuestionPanel } from "../../components/QuestionPanel";
import { motion, AnimatePresence } from "framer-motion";

// Redux Imports (Same as RC)
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
    setCurrentQuestionIndex,
    setViewMode,
    incrementElapsedTime,
    resetDailyPractice,
    commitPendingAttempt,
} from "../../redux_usecase/dailyPracticeSlice";

import {
    useFetchDailyTestDataQuery,
    useLazyFetchExistingSessionDetailsQuery,
    useStartDailyVASessionMutation, // Note: VA specific mutation
    useSaveSessionDetailsMutation,
    useSaveQuestionAttemptsMutation,
} from "../../redux_usecase/dailyPracticeApi";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { DailyRCVAPageSkeleton } from "../../components/DailySkeleton";
import { v4 as uuid4 } from "uuid";
import { useExamNavigationGuard } from "../../navigation_hook/useExamNavigation";

const DailyVAPage: React.FC = () => {
    const dispatch = useDispatch();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

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

    // 1. Data Fetching
    const { data: testData, isLoading: isTestDataLoading } =
        useFetchDailyTestDataQuery();
    const [fetchExistingSession, { isFetching: isSessionLoading }] =
        useLazyFetchExistingSessionDetailsQuery();
    const [startNewSession, { isLoading: isCreatingSession }] =
        useStartDailyVASessionMutation();
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

    //Derived UI Data
    const questions = React.useMemo(
        () =>
            testData?.questions.filter(
                (q) => q.passage_id === null && q.question_type !== "rc_question"
            ) || [],
        [testData?.questions]
    );
    const currentQuestion = questions.find((q) => q.id === currentQuestionId);

    const [showPalette, setShowPalette] = React.useState(true);
    const isLoading = isTestDataLoading || isSessionLoading || isCreatingSession;

    // 2. Initialization

    // Ref to track initialization in progress to prevent duplicate sessions
    const isInitializingRef = useRef(false);

    useEffect(() => {
        // Only run if test data is ready and we haven't initialized a session yet
        // Also check if initialization is already in progress to prevent duplicate calls
        if (!testData || session.id || isLoading || isInitializingRef.current) return;

        const init = async () => {
            // Mark initialization as in progress
            isInitializingRef.current = true;

            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) {
                    return;
                }

                const sessionResult = await fetchExistingSession({
                    user_id: user.id,
                    paper_id: testData.examInfo.id,
                    session_type: "daily_challenge_va",
                });

                const questionIds = questions.map((q) => q.id);

                if (sessionResult.data) {
                    // Resume existing session
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
                    // Start new session
                    const newSession = await startNewSession({
                        user_id: user.id,
                        paper_id: testData.examInfo.id,
                        passage_ids: [],
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
            } finally {
                // Reset initialization flag
                isInitializingRef.current = false;
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        testData,
        session.id,
        dispatch,
        isLoading,
        questions,
        // Note: fetchExistingSession and startNewSession are NOT in dependencies
        // to prevent the effect from running multiple times due to hook reference changes
    ]);

    // 3. Timer
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (viewMode === "exam" && !isLoading) {
            timer = setInterval(() => dispatch(incrementElapsedTime()), 1000);
        }
        return () => clearInterval(timer);
    }, [viewMode, isLoading, dispatch]);

    // 4. Cleanup
    useEffect(() => {
        return () => {
            dispatch(resetDailyPractice());
        };
    }, [dispatch]);

    // 5. Handlers (Identical logic to RC)
    const handleFinishExam = useCallback(async () => {
        if (!session.id) return;

        const confirmSubmit = window.confirm(`Finish VA Practice?`);
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

            await Promise.all([
                saveSession({
                    session_id: session.id,
                    status: "completed",
                    completed_at: new Date().toISOString(),
                    time_spent_seconds: elapsedTime,
                    total_questions: questions.length,
                    correct_answers: progress.correct,
                    score_percentage: progress.percentage,
                    current_question_index: 0,
                }).unwrap(),
                attemptList.length > 0
                    ? saveAttempts({ attempts: attemptList }).unwrap()
                    : Promise.resolve(),
            ]);

            dispatch(setViewMode("solution"));
        } catch (e) {
            console.error("Failed to submit exam:", e);
            alert("Failed to submit. Please check your connection.");
        }
    }, [
        session.id,
        session.user_id,
        attempts,
        elapsedTime,
        progress,
        questions.length,
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
        // Cyclic navigation: if at last question, go to first question
        if (isLastQuestion) {
            dispatch(setCurrentQuestionIndex(0));
        } else {
            dispatch(goToNextQuestion());
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
        // Cyclic navigation: if at last question, go to first question
        if (isLastQuestion) {
            dispatch(setCurrentQuestionIndex(0));
        } else {
            dispatch(goToNextQuestion());
        }
    };

    useEffect(() => {
        if (!session.id) return;

        const confirmSubmit = window.confirm(`Finish VA Practice?`);
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

            await Promise.all([
                saveSession({
                    session_id: session.id,
                    status: "completed",
                    completed_at: new Date().toISOString(),
                    time_spent_seconds: elapsedTime,
                    total_questions: questions.length,
                    correct_answers: progress.correct,
                    score_percentage: progress.percentage,
                    current_question_index: 0,
                }).unwrap(),
                attemptList.length > 0
                    ? saveAttempts({ attempts: attemptList }).unwrap()
                    : Promise.resolve(),
            ]);

            dispatch(setViewMode("solution"));
        } catch (e) {
            console.error("Failed to submit exam:", e);
            alert("Failed to submit. Please check your connection.");
        }
    }, [
        session.id,
        session.user_id,
        attempts,
        elapsedTime,
        progress,
        questions.length,
        saveSession,
        saveAttempts,
        dispatch,
    ]);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (viewMode !== "exam" || Object.keys(attempts).length === 0) return;

            const payload = JSON.stringify({
                session_id: session.id,
                status: "paused",
                time_spent_seconds: elapsedTime,
                current_question_index: currentQuestionIndex,
                attempts,
            });

            navigator.sendBeacon("/api/save-exam-progress", payload);

            e.preventDefault();
            e.returnValue = "";
        };

        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [saveSession, session.id, viewMode, elapsedTime, currentQuestionIndex, attempts]);

    //Just to check the updated attempts on each change if happenning or not
    useEffect(() => {
        console.log(
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%changes in attempts%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%"
        );
        console.log(attempts);
    }, [attempts]);

    if (isLoading || !currentQuestion) {
        return <DailyRCVAPageSkeleton isRC={false} />;
    }

    // ... Render (Keep UI JSX similar to DailyRCPage but without SplitPane for passages) ...
    return (
        <div
            className={`h-screen flex flex-col ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
                }`}
        >

            {/* Header */}
            <header
                className={`shrink-0 h-16 z-30 flex items-center justify-between px-4 md:px-6 border-b backdrop-blur-xl ${isDark
                    ? "bg-bg-primary-dark/90 border-border-dark"
                    : "bg-bg-primary-light/90 border-border-light"
                    }`}
            >
                <div className="flex items-center gap-4">
                    {viewMode === "solution" && (
                        <button
                            onClick={() => navigate("/daily")}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isDark
                                    ? "bg-bg-tertiary-dark text-text-secondary-dark hover:bg-bg-secondary-dark"
                                    : "bg-bg-tertiary-light text-text-secondary-light hover:bg-bg-secondary-light"
                            }`}
                        >
                            ← Back
                        </button>
                    )}
                    <h1
                        className={`font-serif font-bold text-lg md:text-xl ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                    >
                        <span className="hidden sm:inline">
                            {testData?.examInfo.name || "Daily Practice"}:{" "}
                        </span>
                        VA
                    </h1>
                </div>
                {viewMode === "exam" && (
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div
                                className={`text-xs font-medium ${
                                    isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                }`}
                            >
                                Time Spent
                            </div>
                            <div
                                className={`text-lg font-mono font-bold ${
                                    isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                            >
                                {formatTime(elapsedTime)}
                            </div>
                        </div>
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
                )}
                {viewMode === "solution" && (
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div
                                className={`text-xs font-medium ${
                                    isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                }`}
                            >
                                Total Time
                            </div>
                            <div
                                className={`text-lg font-mono font-bold ${
                                    isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                            >
                                {formatTime(elapsedTime)}
                            </div>
                        </div>
                        <div className="text-center">
                            <div
                                className={`text-xs font-medium ${
                                    isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                }`}
                            >
                                Score
                            </div>
                            <div
                                className={`text-lg font-bold ${
                                    isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                            >
                                {progress.correct}/{questions.length}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Body */}
            <div className="flex-1 flex relative overflow-hidden">
                <div className="flex-1 h-full overflow-hidden">
                    <QuestionPanel
                        question={currentQuestion}
                        isDark={isDark}
                        isLastQuestion={isLastQuestion}
                        isFirstQuestion={currentQuestionIndex === 0}
                    />
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
                {viewMode === "exam" && (
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
                                Save & Next
                            </button>
                            <button
                                onClick={handleFinishExam}
                                className="px-4 md:px-6 py-2 md:py-3 bg-green-600 text-white rounded-xl font-medium text-sm md:text-base hover:scale-105 transition-all duration-200"
                            >
                                Submit
                            </button>
                        </div>
                    </>
                )}
            </footer>
        </div>
    );
};

export default DailyVAPage;
