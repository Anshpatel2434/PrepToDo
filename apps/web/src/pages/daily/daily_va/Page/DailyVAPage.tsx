import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../../context/ThemeContext";
import { FloatingNavigation } from "../../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../../ui_components/ThemeToggle";
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
    initializeSession,
    toggleMarkForReview,
    clearResponse,
    goToNextQuestion,
    goToPreviousQuestion,
    setViewMode,
    incrementElapsedTime,
    resetDailyPractice,
} from "../../redux_usecase/dailyPracticeSlice";

import {
    useFetchDailyTestDataQuery,
    useLazyFetchExistingSessionDetailsQuery,
    useStartDailyVASessionMutation, // Note: VA specific mutation
    useSaveSessionDetailsMutation,
    useSaveQuestionAttemptsMutation,
} from "../../redux_usecase/dailyPracticeApi";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

const DailyVAPage: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isDark } = useTheme();

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
    const currentQuestionId = useSelector(selectCurrentQuestionId);
    const progress = useSelector(selectProgressStats);
    const session = useSelector(selectSession);
    const elapsedTime = useSelector(selectElapsedTime);
    const isLastQuestion = useSelector(selectIsLastQuestion);

    //Derived UI Data
    const questions = React.useMemo(() =>
        testData?.questions.filter(
            (q) => q.passage_id === null && q.question_type !== "rc_question"
        ) || [],
    [testData?.questions]);
    const currentQuestion = questions.find((q) => q.id === currentQuestionId);

    const [showPalette, setShowPalette] = React.useState(true);
    const isLoading = isTestDataLoading || isSessionLoading || isCreatingSession;

    // 2. Initialization
    useEffect(() => {
        if (!testData || session.id || isLoading) return;

        const init = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                navigate("/login");
                return;
            }

            const sessionResult = await fetchExistingSession({
                user_id: user.id,
                paper_id: testData.examInfo.id,
                session_type: "daily_challenge_va",
            });

            const questionIds = questions.map((q) => q.id);

            if (sessionResult.data) {
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
        };
        init();
    }, [testData, session.id, dispatch, fetchExistingSession, isLoading, navigate, startNewSession, questions]);

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

    // 5. Navigation Confirmation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (viewMode === "exam" && Object.keys(attempts).length > 0) {
                const confirmationMessage = "You have unsaved progress. Are you sure you want to leave?";
                e.preventDefault();
                e.returnValue = confirmationMessage;
                return confirmationMessage;
            }
        };

        const handlePopState = async () => {
            if (viewMode === "exam" && Object.keys(attempts).length > 0) {
                const shouldLeave = window.confirm("You have unsaved progress. Are you sure you want to leave?");
                if (!shouldLeave) {
                    window.history.pushState(null, "", window.location.pathname);
                    return false;
                }

                // Save session and attempts before leaving
                try {
                    const attemptList = Object.values(attempts).map((a) => ({
                        ...a,
                        user_id: session.user_id,
                        session_id: session.id,
                        user_answer: a.user_answer || {},
                        marked_for_review: a.marked_for_review || false,
                        rationale_viewed: false,
                        rationale_helpful: null,
                        ai_feedback: null,
                    })) as any;

                    await Promise.all([
                        saveSession({
                            session_id: session.id,
                            status: "paused",
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
                } catch (e) {
                    console.error("Failed to save session before leaving:", e);
                }
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [viewMode, attempts, session, elapsedTime, questions.length, progress, currentQuestionIndex, saveSession, saveAttempts]);

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
                user_id: session.user_id,
                session_id: session.id,
                user_answer: a.user_answer || {},
                marked_for_review: a.marked_for_review || false,
                rationale_viewed: false,
                rationale_helpful: null,
                ai_feedback: null,
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
        // Note: We don't necessarily need to hit the API on every 'Next' unless required for strict data safety.
        // For performance, we update Redux (instant) and rely on the final submit or periodic saves.
        // If "Save on Next" is strict requirement, call saveAttempts here.
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
                toggleMarkForReview({
                    questionId: currentQuestion.id,
                    userId: session.user_id,
                    passageId: currentQuestion.passage_id,
                })
            );
        }
        if (!isLastQuestion) {
            dispatch(goToNextQuestion());
        } else {
            handleFinishExam();
        }
    };

    if (isLoading || !currentQuestion) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading VA...
            </div>
        );
    }

    // ... Render (Keep UI JSX similar to DailyRCPage but without SplitPane for passages) ...
    return (
        <div
            className={`min-h-screen ${
                isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
            }`}
        >
            <FloatingThemeToggle />
            <FloatingNavigation />

            {/* Header */}
            <header
                className={`fixed top-0 inset-x-0 h-16 z-30 flex items-center justify-between px-6 border-b backdrop-blur-xl ${
                    isDark
                        ? "bg-bg-primary-dark/90 border-border-dark"
                        : "bg-bg-primary-light/90 border-border-light"
                }`}
            >
                <h1
                        className={`font-serif font-bold text-xl ${
                            isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}
                    >
                        Daily Practice: VA
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="w-32 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{
                                    width: `${(progress.answered / questions.length) * 100}%`,
                                }}
                            />
                        </div>
                        <span
                            className={
                                isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                            }
                        >
                            {progress.answered}/{questions.length}
                        </span>
                    </div>
                </header>

            {/* Main Body */}
                <div className="pt-16 h-screen flex relative overflow-hidden">
                    <div className="flex-1 h-full">
                        <QuestionPanel
                            question={currentQuestion}
                            isDark={isDark}
                        />
                    </div>

                    {/* Palette Toggle Button */}
                <motion.button
                    onClick={() => setShowPalette(!showPalette)}
                    className={`
                                            absolute right-${
                                                                                            showPalette ? "64" : "0"
                                                                                        } top-1/2 -translate-y-1/2 z-40
                                            w-8 h-16 rounded-l-lg border border-r-0
                                            transition-all duration-300
                                            ${
                                                                                            isDark
                                                                                                ? "bg-bg-secondary-dark border-border-dark hover:bg-bg-tertiary-dark"
                                                                                                : "bg-bg-secondary-light border-border-light hover:bg-bg-tertiary-light"
                                                                                        }
                                        `}
                    style={{ right: showPalette ? "256px" : "0" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {showPalette ? (
                        <MdChevronRight
                            className={`w-5 h-5 mx-auto ${
                                isDark
                                    ? "text-text-secondary-dark"
                                    : "text-text-secondary-light"
                            }`}
                        />
                    ) : (
                        <MdChevronLeft
                            className={`w-5 h-5 mx-auto ${
                                isDark
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
                            className={`w-64 border-l overflow-y-auto ${
                                isDark
                                    ? "bg-bg-secondary-dark border-border-dark"
                                    : "bg-bg-secondary-light border-border-light"
                            }`}
                        >
                            <QuestionPalette
                                questions={questions}
                                attempts={attempts}
                                isDark={isDark}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
                <footer
                    className={`fixed bottom-0 inset-x-0 h-20 border-t flex items-center justify-between px-6 backdrop-blur-xl z-30 ${
                        isDark
                            ? "bg-bg-primary-dark/90 border-border-dark"
                            : "bg-bg-primary-light/90 border-border-light"
                    }`}
                >
                    {viewMode === "exam" ? (
                        <>
                            <div className="flex gap-3">
                                <button
                                    onClick={() =>
                                        dispatch(
                                            clearResponse()
                                        )
                                    }
                                    className="px-6 py-2 rounded-lg border"
                                >
                                    Clear Response
                                </button>
                                <button
                                    onClick={handleMarkForReviewAndNext}
                                    className="px-6 py-2 rounded-lg border"
                                >
                                    Mark for Review & Next
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSaveAndNext}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg"
                                >
                                    Save & Next
                                </button>
                                <button
                                    onClick={handleFinishExam}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg"
                                >
                                    Submit
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex gap-4 w-full justify-center">
                            <button
                                onClick={() => dispatch(goToPreviousQuestion())}
                                className="px-6 py-2 border rounded-lg"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => dispatch(goToNextQuestion())}
                                className="px-6 py-2 border rounded-lg"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </footer>
        </div>
    );
};

export default DailyVAPage;
