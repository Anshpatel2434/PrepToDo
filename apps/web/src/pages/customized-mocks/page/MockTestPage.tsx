import React, { useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MdChevronLeft, MdChevronRight, MdArrowBack } from "react-icons/md";
import { useTheme } from "../../../context/ThemeContext";
import { supabase } from "../../../services/apiClient";
import { v4 as uuid4 } from "uuid";

// Redux
import {
    selectViewMode,
    selectCurrentQuestionIndex,
    selectAttempts,
    selectCurrentQuestionId,
    selectProgressStats,
    selectSession,
    selectElapsedTime,
    selectStartTime,
    selectPendingAttempts,
    selectTimeRemaining,
    initializeSession,
    clearResponse,
    goToNextQuestion,
    setViewMode,
    incrementElapsedTime,
    resetCustomizedMock,
    commitPendingAttempt,
    updateConfidenceLevel,
    setSolutionViewType,
    submitAnswer,
    selectSolutionViewType,
    selectCurrentAttempt,
} from "../redux_usecase/customizedMockSlice";

import {
    useFetchMockTestByIdQuery,
    useLazyFetchExistingMockSessionQuery,
    useStartMockSessionMutation,
    useSaveMockSessionDetailsMutation,
    useSaveMockQuestionAttemptsMutation,
} from "../redux_usecase/customizedMocksApi";

import { MockQuestionPalette } from "../components/MockQuestionPalette";
import { QuestionPanel } from "../../../ui_components/exam/QuestionPanel";
import { DailyRCVAPageSkeleton } from "../../daily/components/DailySkeleton";
import { SplitPaneLayout } from "../../../ui_components/exam/SplitPaneLayout";
import type { SolutionViewType } from "../../../ui_components/exam/SolutionToggle";
import type { UUID } from "../../../types";
import { useExamNavigationGuard } from "../../daily/navigation_hook/useExamNavigation";

const MockTestPage: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
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

    const examId = searchParams.get('exam_id');

    // --- 1. Data Fetching & Initialization ---
    const { data: testData, isLoading: isTestDataLoading } = useFetchMockTestByIdQuery(
        { exam_id: examId ? examId : "" },
        { skip: !examId }
    );

    const [fetchExistingSession, { isFetching: isSessionLoading }] =
        useLazyFetchExistingMockSessionQuery();
    const [startNewSession, { isLoading: isCreatingSession }] =
        useStartMockSessionMutation();

    const [saveSession] = useSaveMockSessionDetailsMutation();
    const [saveAttempts] = useSaveMockQuestionAttemptsMutation();

    // Redux Selectors
    const viewMode = useSelector(selectViewMode);
    const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
    const attempts = useSelector(selectAttempts);
    const pendingAttempts = useSelector(selectPendingAttempts);
    const currentQuestionId = useSelector(selectCurrentQuestionId);
    const progress = useSelector(selectProgressStats);
    const session = useSelector(selectSession);
    const elapsedTime = useSelector(selectElapsedTime);
    const startTime = useSelector(selectStartTime);
    const timeRemaining = useSelector(selectTimeRemaining);
    const currentAttempt = useSelector(selectCurrentAttempt);
    const solutionViewType = useSelector(selectSolutionViewType);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const allowNavigation = false;
    const shouldBlock =
        !allowNavigation && viewMode === "exam" && Object.keys(attempts).length > 0;

    useExamNavigationGuard(shouldBlock);

    const { questions, passages, questionOrder } = useMemo(() => {
        if (!testData) return { questions: [], passages: [], questionOrder: [] };

        const allQuestions = testData.questions;
        const allPassages = testData.passages;
        const order: UUID[] = [];

        // Simple sequencing - will be replaced by robust algorithm later
        allPassages.forEach(passage => {
            const rcQuestions = allQuestions
                .filter(q => q.passage_id === passage.id)
                .sort((a, b) => a.created_at.localeCompare(b.created_at));
            order.push(...rcQuestions.map(q => q.id));
        });

        const vaQuestions = allQuestions
            .filter(q => !q.passage_id)
            .sort((a, b) => a.created_at.localeCompare(b.created_at));
        order.push(...vaQuestions.map(q => q.id));

        return {
            questions: allQuestions,
            passages: allPassages,
            questionOrder: order,
        };
    }, [testData]);

    const currentQuestion = questions.find((q) => q.id === currentQuestionId);
    const currentPassage = currentQuestion?.passage_id
        ? passages.find((p) => p.id === currentQuestion.passage_id)
        : null;

    const [showPalette, setShowPalette] = React.useState(true);
    const isLoading = isTestDataLoading || isSessionLoading || isCreatingSession;

    // --- 2. Session Setup Logic ---
    const isInitializingRef = useRef(false);

    useEffect(() => {
        if (!testData || session.id || isLoading || isInitializingRef.current || questionOrder.length === 0) {
            return;
        }

        const init = async () => {
            isInitializingRef.current = true;
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const sessionResult = await fetchExistingSession({
                    user_id: user.id,
                    paper_id: testData.examInfo.id,
                });

                if (sessionResult.data) {
                    dispatch(initializeSession({
                        session: sessionResult.data.session,
                        questionIds: questionOrder,
                        existingAttempts: sessionResult.data.attempts,
                        elapsedTime: sessionResult.data.session.time_spent_seconds,
                        status: sessionResult.data.session.status,
                    }));
                } else {
                    const passageIds = passages.map(p => p.id);
                    const timeLimitSeconds = testData.examInfo.time_limit_minutes
                        ? testData.examInfo.time_limit_minutes * 60
                        : 3600;

                    const newSession = await startNewSession({
                        user_id: user.id,
                        paper_id: testData.examInfo.id,
                        passage_ids: passageIds,
                        question_ids: questionOrder,
                        time_limit_seconds: timeLimitSeconds,
                    }).unwrap();

                    dispatch(initializeSession({
                        session: newSession,
                        questionIds: questionOrder,
                        elapsedTime: 0,
                    }));
                }
            } catch (err) {
                console.error("Error during initialization:", err);
            } finally {
                isInitializingRef.current = false;
            }
        };

        init();
    }, [testData, session.id, dispatch, isLoading, questionOrder, passages, fetchExistingSession, startNewSession]);

    // --- 3. Timer Logic ---
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (viewMode === "exam" && !isLoading && timeRemaining > 0) {
            timer = setInterval(() => dispatch(incrementElapsedTime()), 1000);
        } else if (timeRemaining === 0 && viewMode === "exam") {
            handleAutoSubmit();
        }
        return () => clearInterval(timer);
    }, [viewMode, isLoading, timeRemaining, dispatch]);

    // --- 4. State Persistence ---
    // Use a ref to store the latest state for the cleanup function
    const stateRef = useRef({
        session,
        attempts,
        currentQuestionIndex,
        elapsedTime,
        progress,
        questions,
        viewMode
    });

    useEffect(() => {
        stateRef.current = {
            session,
            attempts,
            currentQuestionIndex,
            elapsedTime,
            progress,
            questions,
            viewMode
        };
    }, [session, attempts, currentQuestionIndex, elapsedTime, progress, questions, viewMode]);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleBeforeUnload = async (e: any) => {
            const current = stateRef.current;
            if (current.viewMode === "exam" && current.session.id) {
                // Removed preventDefault to avoid dialog
                const attemptList = Object.values(current.attempts).filter(a => a.question_id);
                if (attemptList.length > 0) {
                    await saveAttempts({ attempts: attemptList as any }).unwrap();
                }
                await saveSession({
                    session_id: current.session.id,
                    current_question_index: current.currentQuestionIndex,
                    time_spent_seconds: current.elapsedTime,
                    status: "in_progress",
                    total_questions: current.questions.length,
                    correct_answers: current.progress.correct,
                    score_percentage: current.progress.percentage,
                }).unwrap();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            const current = stateRef.current;
            if (current.viewMode === "exam" && current.session.id) {
                const attemptList = Object.values(current.attempts).filter(a => a.question_id);
                // Fire and forget on unmount
                if (attemptList.length > 0) {
                    saveAttempts({ attempts: attemptList as any });
                }
                saveSession({
                    session_id: current.session.id,
                    current_question_index: current.currentQuestionIndex,
                    time_spent_seconds: current.elapsedTime,
                    status: "in_progress",
                    total_questions: current.questions.length,
                    correct_answers: current.progress.correct,
                    score_percentage: current.progress.percentage,
                });
            }
        };
    }, [saveAttempts, saveSession]);

    // --- 5. Handlers ---
    const handleAutoSubmit = useCallback(async () => {
        if (!session.id) return;
        try {
            const timeNow = Date.now();
            const finalTimeSpentOnCurrent = startTime ? Math.floor((timeNow - startTime) / 1000) : 0;

            const attemptList = Object.values(attempts).map((a) => {
                const isCurrent = a.question_id === currentQuestionId;
                const pending = pendingAttempts[a.question_id!] || {};
                return {
                    ...a,
                    ...pending,
                    time_spent_seconds: (a.time_spent_seconds || 0) + (pending.time_spent_seconds || 0) + (isCurrent ? finalTimeSpentOnCurrent : 0),
                    id: a.id ? a.id : uuid4(),
                    user_id: session.user_id,
                    session_id: session.id,
                    user_answer: pending.user_answer || a.user_answer || {},
                    marked_for_review: pending.marked_for_review ?? a.marked_for_review ?? false,
                    rationale_viewed: false,
                    rationale_helpful: null,
                    ai_feedback: null,
                };
            }) as any;

            await Promise.all([
                saveSession({
                    session_id: session.id,
                    status: "completed",
                    completed_at: new Date().toISOString(),
                    time_spent_seconds: session.time_limit_seconds || elapsedTime,
                    total_questions: questions.length,
                    correct_answers: progress.correct,
                    score_percentage: progress.percentage,
                    current_question_index: currentQuestionIndex,
                }).unwrap(),
                attemptList.length > 0 ? saveAttempts({ attempts: attemptList }).unwrap() : Promise.resolve(),
            ]);

            dispatch(setViewMode("solution"));
        } catch (err) {
            console.error("Auto-submit failed:", err);
        }
    }, [session.id, session.user_id, session.time_limit_seconds, attempts, pendingAttempts, elapsedTime, startTime, progress, questions.length, currentQuestionId, currentQuestionIndex, saveSession, saveAttempts, dispatch]);

    const handleFinishExam = useCallback(async () => {
        if (!session.id) return;
        if (!window.confirm(`You have answered ${progress.answered}/${questions.length}. Submit?`)) return;

        try {
            const timeNow = Date.now();
            const finalTimeSpentOnCurrent = startTime ? Math.floor((timeNow - startTime) / 1000) : 0;
            const attemptList = Object.values(attempts).map((a) => {
                const isCurrent = a.question_id === currentQuestionId;
                const pending = pendingAttempts[a.question_id!] || {};
                return {
                    ...a,
                    ...pending,
                    time_spent_seconds: (a.time_spent_seconds || 0) + (pending.time_spent_seconds || 0) + (isCurrent ? finalTimeSpentOnCurrent : 0),
                    id: a.id ? a.id : uuid4(),
                    user_id: session.user_id,
                    session_id: session.id,
                    user_answer: pending.user_answer || a.user_answer || {},
                    marked_for_review: pending.marked_for_review ?? a.marked_for_review ?? false,
                    rationale_viewed: false,
                    rationale_helpful: null,
                    ai_feedback: null,
                };
            }) as any;

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
                attemptList.length > 0 ? saveAttempts({ attempts: attemptList }).unwrap() : Promise.resolve(),
            ]);

            dispatch(setViewMode("solution"));
        } catch (err) {
            console.error("Failed to submit exam:", err);
            alert("Failed to submit. Please check your connection.");
        }
    }, [session.id, session.user_id, attempts, pendingAttempts, elapsedTime, startTime, progress, questions.length, currentQuestionId, currentQuestionIndex, saveSession, saveAttempts, dispatch]);

    const handleSaveAndNext = () => {
        if (currentQuestion) {
            dispatch(commitPendingAttempt({
                questionId: currentQuestion.id,
                userId: session.user_id,
                passageId: currentQuestion.passage_id ? currentQuestion.passage_id : null,
                markForReview: false,
            }));
        }
        dispatch(goToNextQuestion());
    };

    const handleMarkForReviewAndNext = () => {
        if (currentQuestion) {
            dispatch(commitPendingAttempt({
                questionId: currentQuestion.id,
                userId: session.user_id,
                passageId: currentQuestion.passage_id ? currentQuestion.passage_id : null,
                markForReview: true,
            }));
        }
        dispatch(goToNextQuestion());
    };

    const handleAnswerUpdate = useCallback((answerValue: string) => {
        if (viewMode !== 'exam' || !currentQuestion || !session.user_id) return;
        const correctAnswer = (currentQuestion.correct_answer as any)?.answer || currentQuestion.correct_answer;
        const isCorrect = answerValue === correctAnswer;

        dispatch(submitAnswer({
            questionId: currentQuestion.id,
            userId: session.user_id,
            passageId: currentQuestion.passage_id || null,
            answer: answerValue,
            isCorrect
        }));
    }, [dispatch, currentQuestion, session.user_id, viewMode]);

    const handleConfidenceUpdate = useCallback((val: number) => {
        if (!currentQuestion) return;
        dispatch(updateConfidenceLevel({
            questionId: currentQuestion.id,
            confidence_level: val
        }));
    }, [dispatch, currentQuestion]);

    const handleSolutionViewChange = useCallback((val: SolutionViewType) => {
        dispatch(setSolutionViewType(val));
    }, [dispatch]);

    useEffect(() => {
        return () => {
            dispatch(resetCustomizedMock());
        };
    }, [dispatch]);

    // --- 6. Render ---
    if (isLoading || !currentQuestion) {
        return <DailyRCVAPageSkeleton isRC={!!currentPassage} />;
    }

    return (
        <div className={`h-screen flex flex-col ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
            {/* Header */}
            <header className={`shrink-0 h-16 z-30 flex items-center justify-between px-4 md:px-6 border-b backdrop-blur-xl ${isDark ? "bg-bg-primary-dark/90 border-border-dark" : "bg-bg-primary-light/90 border-border-light"}`}>
                <div className="flex items-center gap-4">
                    {viewMode === "solution" && (
                        <button onClick={() => navigate("/customized-mocks")} className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-bg-tertiary-dark text-text-primary-dark" : "hover:bg-bg-tertiary-light text-text-primary-light"}`} title="Back to Customized Mocks">
                            <MdArrowBack className="w-6 h-6" />
                        </button>
                    )}
                    <h1 className={`font-serif font-bold text-lg md:text-xl ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                        <span className="hidden sm:inline">{testData?.examInfo.name || "Mock Test"}</span>
                        {currentPassage ? " - RC" : " - VA"}
                    </h1>
                </div>

                <div className={`absolute left-1/2 -translate-x-1/2 font-mono text-lg font-bold ${timeRemaining < 60 ? "text-red-500" : isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                    {formatTime(timeRemaining)}
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-20 md:w-32 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(progress.answered / questions.length) * 100}%` }} />
                    </div>
                    <span className={`text-sm ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        {progress.answered}/{questions.length}
                    </span>
                </div>
            </header>

            {/* Main Body */}
            <div className="flex-1 flex relative overflow-hidden">
                <div className="flex-1 h-full overflow-hidden">
                    {currentPassage ? (
                        <SplitPaneLayout
                            isDark={isDark}
                            passage={currentPassage}
                            showPassage={true}
                            isExamMode={viewMode === "exam"}
                        >
                            <QuestionPanel
                                question={currentQuestion}
                                isDark={isDark}
                                viewMode={viewMode}
                                userAnswer={(currentAttempt?.user_answer as any)?.user_answer}
                                confidenceValue={currentAttempt?.confidence_level || 0}
                                solutionViewType={solutionViewType}
                                onAnswerUpdate={handleAnswerUpdate}
                                onConfidenceUpdate={handleConfidenceUpdate}
                                onSolutionViewTypeChange={handleSolutionViewChange}
                                aiInsights={{
                                    isAnalysed: session.is_analysed,
                                    diagnostic: session.analytics?.analytics?.diagnostics?.find((d: any) => d.attempt_id === currentAttempt?.id)
                                }}
                                isCorrect={currentAttempt?.is_correct}
                            />
                        </SplitPaneLayout>
                    ) : (
                        <div className="h-full overflow-y-auto p-6">
                            <QuestionPanel
                                question={currentQuestion}
                                isDark={isDark}
                                viewMode={viewMode}
                                userAnswer={(currentAttempt?.user_answer as any)?.user_answer}
                                confidenceValue={currentAttempt?.confidence_level || 0}
                                solutionViewType={solutionViewType}
                                onAnswerUpdate={handleAnswerUpdate}
                                onConfidenceUpdate={handleConfidenceUpdate}
                                onSolutionViewTypeChange={handleSolutionViewChange}
                                aiInsights={{
                                    isAnalysed: session.is_analysed,
                                    diagnostic: session.analytics?.analytics?.diagnostics?.find((d: any) => d.attempt_id === currentAttempt?.id)
                                }}
                                isCorrect={currentAttempt?.is_correct}
                            />
                        </div>
                    )}
                </div>

                {/* Palette Toggle */}
                <motion.button
                    onClick={() => setShowPalette(!showPalette)}
                    className={`absolute top-1/2 -translate-y-1/2 z-60 w-8 h-16 rounded-l-lg border border-r-0 transition-all duration-300 flex items-center justify-center ${isDark ? "bg-bg-secondary-dark border-border-dark hover:bg-bg-tertiary-dark" : "bg-bg-secondary-light border-border-light hover:bg-bg-tertiary-light"}`}
                    style={{ right: showPalette ? paletteWidth : 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {showPalette ? <MdChevronRight className={`w-5 h-5 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`} /> : <MdChevronLeft className={`w-5 h-5 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`} />}
                </motion.button>

                {/* Palette Drawer */}
                <AnimatePresence>
                    {showPalette && (
                        <motion.div
                            initial={{ x: 300 }}
                            animate={{ x: 0 }}
                            exit={{ x: 300 }}
                            className={`fixed md:relative inset-y-0 right-0 z-50 md:z-auto w-72 md:w-64 border-l overflow-y-auto shadow-2xl md:shadow-none ${isDark ? "bg-bg-secondary-dark border-border-dark" : "bg-bg-secondary-light border-border-light"}`}
                        >
                            <MockQuestionPalette
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
            {viewMode === "exam" && (
                <footer className={`shrink-0 min-h-20 md:h-20 border-t flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 md:py-0 backdrop-blur-xl z-30 gap-4 ${isDark ? "bg-bg-primary-dark/90 border-border-dark" : "bg-bg-primary-light/90 border-border-light"}`}>
                    <div className="flex gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-start">
                        <button onClick={() => dispatch(clearResponse())} className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium text-sm md:text-base transition-all duration-200 ${isDark ? "bg-brand-primary-dark text-white hover:scale-105" : "bg-brand-primary-light text-white hover:scale-105"}`}>Clear</button>
                        <button onClick={handleMarkForReviewAndNext} className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium text-sm md:text-base transition-all duration-200 ${isDark ? "bg-brand-primary-dark text-white hover:scale-105" : "bg-brand-primary-light text-white hover:scale-105"}`}>Mark for Review</button>
                    </div>
                    <div className="flex gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end">
                        <button onClick={handleSaveAndNext} className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium text-sm md:text-base transition-all duration-200 ${isDark ? "bg-brand-primary-dark text-white hover:scale-105" : "bg-brand-primary-light text-white hover:scale-105"}`}>Save & Next</button>
                        <button onClick={handleFinishExam} className="px-4 md:px-6 py-2 md:py-3 bg-green-600 text-white rounded-xl font-medium text-sm md:text-base hover:scale-105 transition-all duration-200">Submit</button>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default MockTestPage;
