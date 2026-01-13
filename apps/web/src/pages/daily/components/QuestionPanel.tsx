import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import type { Option, Question } from "../../../types";
import {
    selectViewMode,
    selectCurrentAttempt,
    submitAnswer,
    selectSolutionViewType,
    selectSession,
    goToNextQuestion,
    goToPreviousQuestion,
} from "../redux_usecase/dailyPracticeSlice";
import { ConfidenceSelector } from "./ConfidenceSelector";
import { SolutionToggle } from "./SolutionToggle";

interface QuestionPanelProps {
    question: Question;
    isDark: boolean;
    isLastQuestion: boolean;
    isFirstQuestion: boolean;
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({
    question,
    isDark,
    isLastQuestion,
    isFirstQuestion,
}) => {
    const dispatch = useDispatch();
    const viewMode = useSelector(selectViewMode);
    const solutionViewType = useSelector(selectSolutionViewType);
    const currentAttempt = useSelector(selectCurrentAttempt);
    const session = useSelector(selectSession);
    const [showAIToast, setShowAIToast] = useState(false);
    const [showAILoader, setShowAILoader] = useState(false);
    const [hasShownToast, setHasShownToast] = useState(false);

    const isExamMode = viewMode === "exam";

    // AI Insights Logic
    const isAttemptCorrect = currentAttempt?.is_correct;
    const hasAnalytics = session.is_analysed && session.analytics;

    // Poll for analytics when in solution mode and not yet analysed
    useEffect(() => {
        if (!isExamMode && session.id && !session.is_analysed && !hasShownToast) {
            setShowAILoader(true);
            const pollInterval = setInterval(() => {
                // This would trigger a refetch of the session
                // For now, we'll just set a timeout to simulate analysis
            }, 3000);

            // Simulate analysis completion after 5 seconds
            const timeout = setTimeout(() => {
                setShowAILoader(false);
                if (!hasShownToast) {
                    setShowAIToast(true);
                    setHasShownToast(true);
                    setTimeout(() => setShowAIToast(false), 5000);
                }
            }, 5000);

            return () => {
                clearInterval(pollInterval);
                clearTimeout(timeout);
            };
        }
    }, [isExamMode, session.id, session.is_analysed, hasShownToast]);

    // Handle solution view type toggle
    const handleSolutionViewToggle = useCallback((type: "common" | "personalized") => {
        if (type === "personalized") {
            if (isAttemptCorrect) {
                // Don't toggle, show message
                return;
            }
            if (!hasAnalytics) {
                setShowAILoader(true);
                return;
            }
        }
    }, [isAttemptCorrect, hasAnalytics]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userAnswer = (currentAttempt?.user_answer as any)?.user_answer || "";
    const selectedOption = userAnswer; // For standard questions
    const jumbleSequence = userAnswer; // For TITA questions

    const handleAnswerUpdate = useCallback(
        (answerValue: string) => {
            if (!isExamMode) return;

            // Determine correctness immediately for the record
            // (Note: For TITA, strictly matching string; for options, matching ID)
            const isCorrect = answerValue === question.correct_answer?.answer;

            dispatch(
                submitAnswer({
                    questionId: question.id,
                    userId: "current-user-id", // Replace with selector or context
                    passageId: question.passage_id,
                    answer: answerValue,
                    isCorrect,
                })
            );
        },
        [dispatch, question, isExamMode]
    );

    // Helpers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformOptions = (options: any): Option[] => {
        if (!options) return [];
        if (Array.isArray(options)) {
            return options.map((opt, i) => ({
                id: String.fromCharCode(65 + i),
                text: typeof opt === "string" ? opt : opt.text || String(opt),
            }));
        }
        return Object.entries(options).map(([k, v]) => ({
            id: k,
            text: typeof v === "string" ? v : String(v),
        }));
    };

    const getSentences = (q: Question): Option[] => {
        if (!q.jumbled_sentences || typeof q.jumbled_sentences !== "object")
            return [];
        const sentences = Object.entries(q.jumbled_sentences).map(([k, v]) => ({
            id: k,
            text: typeof v === "string" ? v : String(v),
        }))
        return q.question_type === "para_jumble" ? sentences.slice(0,4) : sentences;
    };

    const getOptionClass = (option: Option) => {
        const isSelected = selectedOption === option.id;
        const correctAnswerId =
            question.correct_answer?.answer || question.correct_answer;
        const isCorrect = correctAnswerId === option.id;

        if (isExamMode) {
            return `w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                    ? isDark
                        ? "bg-brand-primary-dark/20 border-brand-primary-dark text-text-primary-dark ring-2 ring-brand-accent-light"
                        : "bg-brand-primary-light/10 border-brand-primary-light text-text-primary-light ring-2 ring-brand-accent-light"
                    : isDark
                    ? "bg-bg-tertiary-dark text-text-primary-dark border-border-dark hover:border-brand-primary-dark"
                    : "bg-bg-tertiary-light text-text-primary-light border-border-light hover:border-brand-primary-light"
            }`;
        }
        // Solution Mode
        if (isCorrect)
            return `w-full p-4 rounded-xl border-2 text-left ${
                isDark
                    ? "bg-success/20 border-success text-success"
                    : "bg-success/10 border-success text-success"
            }`;
        if (isSelected && !isCorrect)
            return `w-full p-4 rounded-xl border-2 text-left ${
                isDark
                    ? "bg-error/20 border-error text-error"
                    : "bg-error/10 border-error text-error"
            }`;

        return `w-full p-4 rounded-xl border-2 text-left opacity-50 ${
            isDark
            ? "bg-bg-tertiary-dark text-text-primary-dark border-border-dark"
            : "bg-bg-tertiary-light text-text-primary-light border-border-light"
        }`;
    };

    return (
        <div
            className={`h-full overflow-y-auto ${
                isDark ? "scrollbar-dark" : "scrollbar-light"
            }`}
        >
            <div className="p-4 md:p-6 space-y-6">
                {/* Badge */}
                <div className="flex items-center gap-2">
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                            isDark
                                ? "bg-brand-primary-dark/30 text-brand-primary-dark"
                                : "bg-brand-primary-light/20 text-brand-primary-light"
                        }`}
                    >
                        {question.question_type.replace(/_/g, " ")}
                    </span>
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${question.difficulty === "easy" ? "bg-success/80" : question.difficulty === "medium" ? "bg-warning/80" : "bg-error/80"} ${
                            isDark ? "bg-bg-tertiary-dark text-text-primary-dark" : "bg-bg-tertiary-light text-text-primary-light"
                        }`}
                    >
                        {question.difficulty || "Medium"}
                    </span>
                </div>

                {/* Text */}
                <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-lg font-semibold whitespace-pre-line ${
                        isDark ? "text-text-primary-dark" : "text-text-primary-light"
                    }`}
                >
                    {question.question_text}
                </motion.h3>

                {/* Content Area */}
                {question.question_type === "para_jumble" ||
                question.question_type === "odd_one_out" ? (
                    <div className="space-y-4">
                        <div
                            className={`p-4 rounded-xl border ${
                                isDark
                                    ? "bg-bg-tertiary-dark border-border-dark"
                                    : "bg-bg-tertiary-light border-border-light"
                            }`}
                        >
                            {getSentences(question).map((s) => (
                                <div
                                    key={s.id}
                                    className={`p-3 mb-2 rounded-lg border flex gap-3 ${
                                        isDark
                                            ? "bg-bg-secondary-dark text-text-primary-dark border-border-dark"
                                        : "bg-bg-secondary-light text-text-primary-light border-border-light"
                                    }`}
                                >
                                    <span className="font-mono font-bold opacity-50">{s.id}</span>
                                    <span className="whitespace-pre-line">{s.text}</span>
                                </div>
                            ))}
                        </div>
                        {isExamMode ? (
                            <input
                                type="text"
                                value={jumbleSequence}
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase().slice(0, 4);
                                    handleAnswerUpdate(val);
                                }}
                                placeholder="Enter Sequence (e.g. 2143)"
                                className={`w-full p-4 rounded-xl border-2 text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary-light ${
                                    isDark
                                        ? "bg-bg-tertiary-dark text-text-primary-dark border-border-dark"
                                        : "bg-bg-tertiary-light text-text-primary-light border-border-light"
                                }`}
                            />
                        ) : (
                                    <div className={`p-4 rounded-xl border text-center font-mono text-lg ${isDark
                                            ? " text-text-primary-dark "
                                            : " text-text-primary-light "
                                } `}>
                                Your Answer:{" "}
                                <span
                                    className={
                                        question.correct_answer.answer === userAnswer
                                            ? "text-success"
                                            : "text-error"
                                    }
                                >
                                    {userAnswer || "-"}
                                </span>
                                <br />
                                Correct:{" "}
                                <span className="text-success">
                                    {question.correct_answer.answer}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transformOptions(question.options).map((opt, i) => (
                            <motion.button
                                key={opt.id}
                                onClick={() => handleAnswerUpdate(opt.id)}
                                className={getOptionClass(opt)}
                                disabled={!isExamMode}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="font-mono font-bold opacity-70">
                                        {opt.id}
                                    </span>
                                    <span className="flex-1 whitespace-pre-line">{opt.text}</span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}

                {/* Footer Elements */}
                {isExamMode && (
                    <div className="pt-4">
                        <ConfidenceSelector isDark={isDark} />
                    </div>
                )}

                {!isExamMode && (
                    <>
                        {/* AI Insights Toast */}
                        <AnimatePresence>
                            {showAIToast && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`p-4 rounded-xl border mb-4 ${
                                        isDark
                                            ? "bg-brand-primary-dark/20 border-brand-primary-dark"
                                            : "bg-brand-primary-light/20 border-brand-primary-light"
                                    }`}
                                >
                                    <p
                                        className={`text-sm font-medium ${
                                            isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                        }`}
                                    >
                                        🎉 AI Insights are now available!
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* AI Loader */}
                        {solutionViewType === "personalized" && showAILoader && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`p-6 rounded-xl border mb-4 ${
                                    isDark
                                        ? "bg-bg-secondary-dark text-text-secondary-dark border-border-dark"
                                        : "bg-bg-secondary-light text-text-secondary-light border-border-light"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        className="w-6 h-6 border-2 border-current rounded-full"
                                        style={{ borderTopColor: "transparent" }}
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                    />
                                    <p className="text-sm">
                                        AI is analyzing your mistakes. Meanwhile, explore the common solutions.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Correct Attempt Message */}
                        {solutionViewType === "personalized" && isAttemptCorrect && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`p-6 rounded-xl border mb-4 ${
                                    isDark
                                        ? "bg-bg-secondary-dark text-text-secondary-dark border-border-dark"
                                        : "bg-bg-secondary-light text-text-secondary-light border-border-light"
                                }`}
                            >
                                <p className="text-sm">
                                    AI insights are only available for incorrect attempts.
                                </p>
                            </motion.div>
                        )}

                        {/* Solution Section */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`mt-6 p-6 rounded-xl border ${
                                isDark
                                    ? "bg-bg-secondary-dark text-text-secondary-dark border-border-dark"
                                    : "bg-bg-secondary-light text-text-secondary-light border-border-light"
                            }`}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Solution</h4>
                                <SolutionToggle
                                    hasPersonalizedRationale={!!question.rationale}
                                    isDark={isDark}
                                />
                            </div>
                            <p className="leading-relaxed opacity-90 whitespace-pre-line">
                                {solutionViewType === "personalized" && hasAnalytics
                                    ? (() => {
                                          const analytics = session.analytics as any;
                                          const attemptId = currentAttempt?.id;
                                          const diagnostic = analytics?.analytics?.diagnostics?.find(
                                              (d: any) => d.attempt_id === attemptId
                                          );
                                          return diagnostic?.trap_analysis || question.rationale;
                                      })()
                                    : question.rationale}
                            </p>
                        </motion.div>

                        {/* Navigation Buttons for Solution Mode */}
                        <div className="flex gap-4 w-full justify-center mt-6">
                            <button
                                onClick={() => dispatch(goToPreviousQuestion())}
                                className={`px-6 py-2 border rounded-lg ${
                                    isDark
                                        ? "border-border-dark text-text-primary-dark"
                                        : "border-border-light text-text-primary-light"
                                }`}
                                disabled={isFirstQuestion}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => dispatch(goToNextQuestion())}
                                className={`px-6 py-2 border rounded-lg ${
                                    isDark
                                        ? "border-border-dark text-text-primary-dark"
                                        : "border-border-light text-text-primary-light"
                                }`}
                            >
                                {isLastQuestion ? "Back to Start" : "Next"}
                            </button>
                        </div>
                    </>
                )}
                <div />
            </div>
        </div>
    );
};

export default QuestionPanel;
