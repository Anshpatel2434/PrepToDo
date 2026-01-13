import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import type { Option, Question } from "../../../types";
import {
    selectViewMode,
    selectCurrentAttempt,
    submitAnswer,
    selectSolutionViewType,
    selectSession,
} from "../redux_usecase/dailyPracticeSlice";
import { ConfidenceSelector } from "./ConfidenceSelector";
import { SolutionToggle } from "./SolutionToggle";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

interface QuestionPanelProps {
    question: Question;
    isDark: boolean;
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({
    question,
    isDark,
}) => {
    const dispatch = useDispatch();
    const viewMode = useSelector(selectViewMode);
    const solutionViewType = useSelector(selectSolutionViewType); // "common" | "personalized"
    const currentAttempt = useSelector(selectCurrentAttempt);
    const session = useSelector(selectSession);

    const isExamMode = viewMode === "exam";

    // Derived State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userAnswer = (currentAttempt?.user_answer as any)?.user_answer || "";
    const selectedOption = userAnswer; // For standard questions
    const jumbleSequence = userAnswer; // For TITA questions

    const handleAnswerUpdate = useCallback(
        (answerValue: string) => {
            if (!isExamMode) return;

            // Determine correctness immediately for the record
            const isCorrect = answerValue === question.correct_answer?.answer;

            dispatch(
                submitAnswer({
                    questionId: question.id,
                    userId: session.user_id,
                    passageId: question.passage_id,
                    answer: answerValue,
                    isCorrect,
                })
            );
        },
        [dispatch, question, isExamMode, session.user_id]
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
        return q.question_type === "para_jumble" ? sentences.slice(0, 4) : sentences;
    };

    const getOptionClass = (option: Option) => {
        const isSelected = selectedOption === option.id;
        const correctAnswerId =
            question.correct_answer?.answer || question.correct_answer;
        const isCorrect = correctAnswerId === option.id;

        if (isExamMode) {
            return `w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${isSelected
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
            return `w-full p-4 rounded-xl border-2 text-left ${isDark
                    ? "bg-success/20 border-success text-success"
                    : "bg-success/10 border-success text-success"
                }`;
        if (isSelected && !isCorrect)
            return `w-full p-4 rounded-xl border-2 text-left ${isDark
                    ? "bg-error/20 border-error text-error"
                    : "bg-error/10 border-error text-error"
                }`;

        return `w-full p-4 rounded-xl border-2 text-left opacity-50 ${isDark
                ? "bg-bg-tertiary-dark text-text-primary-dark border-border-dark"
                : "bg-bg-tertiary-light text-text-primary-light border-border-light"
            }`;
    };

    const renderAIInsights = () => {
        if (!session.is_analysed) {
            return (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-brand-primary-light border-t-transparent rounded-full"
                    />
                    <p className={`text-center font-medium ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        AI is analyzing your mistakes...
                    </p>
                    <p className="text-xs text-center opacity-60">
                        Encourage checking common solutions meanwhile.
                    </p>
                </div>
            );
        }

        if (currentAttempt?.is_correct) {
            return (
                <div className="p-6 text-center">
                    <p className={`font-medium ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        AI insights are generated only for incorrect attempts.
                    </p>
                </div>
            );
        }

        const diagnostic = session.analytics?.analytics?.diagnostics?.find(
            (d: any) => d.attempt_id === currentAttempt?.id
        );

        if (!diagnostic) {
            return (
                <div className="p-6 text-center">
                    <p className={`font-medium ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        No AI insights available for this attempt.
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div>
                    <h5 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-60">Trap Analysis</h5>
                    <p className="leading-relaxed">{diagnostic.trap_analysis}</p>
                </div>

                <div>
                    <h5 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-60">Possible Reasoning Failures</h5>
                    <div className="space-y-3">
                        {diagnostic.dominant_reasoning_failures?.map((f: any, i: number) => (
                            <div key={i} className={`p-3 rounded-lg ${isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"}`}>
                                <div className="text-xs font-bold uppercase text-brand-primary-light mb-1">{f.reasoning_node_label}</div>
                                <div className="text-sm">{f.failure_description}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {diagnostic.error_pattern_keys && (
                    <div>
                        <h5 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-60">Error Patterns</h5>
                        <div className="flex flex-wrap gap-2">
                            {diagnostic.error_pattern_keys.map((key: string) => (
                                <span key={key} className="px-2 py-1 rounded-md bg-error/10 text-error text-xs font-medium">
                                    {key.replace(/_/g, " ")}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className={`h-full flex flex-col ${isDark ? "scrollbar-dark" : "scrollbar-light"
                }`}
        >
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-6 space-y-6">
                    {/* Badge */}
                    <div className="flex items-center gap-2">
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${isDark
                                    ? "bg-brand-primary-dark/30 text-brand-primary-dark"
                                    : "bg-brand-primary-light/20 text-brand-primary-light"
                                }`}
                        >
                            {question.question_type.replace(/_/g, " ")}
                        </span>
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${question.difficulty === "easy" ? "bg-success/80" : question.difficulty === "medium" ? "bg-warning/80" : "bg-error/80"} ${isDark ? "bg-bg-tertiary-dark text-text-primary-dark" : "bg-bg-tertiary-light text-text-primary-light"
                                }`}
                        >
                            {question.difficulty || "Medium"}
                        </span>
                    </div>

                    {/* Text */}
                    <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-lg font-semibold whitespace-pre-line ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                    >
                        {question.question_text}
                    </motion.h3>

                    {/* Content Area */}
                    {question.question_type === "para_jumble" ||
                        question.question_type === "odd_one_out" ? (
                        <div className="space-y-4">
                            <div
                                className={`p-4 rounded-xl border ${isDark
                                        ? "bg-bg-tertiary-dark border-border-dark"
                                        : "bg-bg-tertiary-light border-border-light"
                                    }`}
                            >
                                {getSentences(question).map((s) => (
                                    <div
                                        key={s.id}
                                        className={`p-3 mb-2 rounded-lg border flex gap-3 ${isDark
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
                                    className={`w-full p-4 rounded-xl border-2 text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary-light ${isDark
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
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`mt-6 p-6 rounded-xl border ${isDark
                                    ? "bg-bg-secondary-dark text-text-secondary-dark border-border-dark"
                                    : "bg-bg-secondary-light text-text-secondary-light border-border-light"
                                }`}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Solution</h4>
                                <SolutionToggle
                                    hasPersonalizedRationale={true} // Always show AI Insights toggle in solution mode
                                    isDark={isDark}
                                />
                            </div>
                            <div className="leading-relaxed opacity-90 whitespace-pre-line">
                                {
                                    solutionViewType === "personalized"
                                        ? renderAIInsights()
                                        : question.rationale
                                }
                            </div>
                        </motion.div>
                    )}
                    <div className="h-20" /> {/* Spacer for navigation buttons */}
                </div>
            </div>
        </div>
    );
};

export default QuestionPanel;
