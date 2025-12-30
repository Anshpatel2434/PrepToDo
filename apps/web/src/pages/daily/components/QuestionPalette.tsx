import React from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import type { Question, QuestionAttempt, UUID } from "../../../types";
import {
    selectCurrentQuestionIndex,
    setCurrentQuestionIndex,
    selectViewMode,
} from "../redux_usecase/dailyPracticeSlice";

interface QuestionPaletteProps {
    questions: Question[];
    attempts: Record<UUID, Partial<QuestionAttempt>>;
    pendingAttempts?: Record<UUID, Partial<QuestionAttempt>>;
    isDark: boolean;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
    questions,
    attempts,
    pendingAttempts = {},
    isDark,
}) => {
    const dispatch = useDispatch();
    const currentIndex = useSelector(selectCurrentQuestionIndex);
    const viewMode = useSelector(selectViewMode);

    // Derived Status Helpers
    const getStatus = (questionId: string) => {
        // First check pending attempts (has unsaved changes)
        const pending = pendingAttempts[questionId];
        if (pending) {
            const hasAnswer = (pending.user_answer as any)?.user_answer != null;
            if (pending.marked_for_review) return "marked_for_review";
            return hasAnswer ? "answered" : "not_visited";
        }
        // Then check saved attempts
        const attempt = attempts[questionId];
        if (!attempt) return "not_visited";
        if (attempt.marked_for_review) return "marked_for_review";
        // Check if user_answer exists and is not null/undefined
        const hasAnswer = (attempt.user_answer as any)?.user_answer != null;
        return hasAnswer ? "answered" : "not_visited";
    };

    const getStatusColor = (questionId: string) => {
        const status = getStatus(questionId);
        switch (status) {
            case "answered":
                return isDark
                    ? "bg-success/80 border-success text-white"
                    : "bg-success border-success text-white";
            case "marked_for_review":
                return isDark
                    ? "bg-info/80 border-info text-white"
                    : "bg-info border-info text-white";
            default:
                return isDark
                    ? "bg-bg-tertiary-dark border-border-dark"
                    : "bg-bg-tertiary-light border-border-light";
        }
    };

    // Calculate Counts Memoized
    const allAttempts = { ...attempts, ...pendingAttempts };
    const stats = React.useMemo(
        () => ({
            answered: Object.values(allAttempts).filter(
                (a) =>
                    (a.user_answer as any)?.user_answer != null && !a.marked_for_review
            ).length,
            marked: Object.values(allAttempts).filter((a) => a.marked_for_review).length,
            notVisited: questions.length - Object.keys(allAttempts).length,
        }),
        [allAttempts, questions.length]
    );

    return (
        <motion.div
            className={`h-full w-64 shrink-0 backdrop-blur-xl border-l shadow-xl flex flex-col ${
                isDark
                    ? "bg-bg-primary-dark/95 border-border-dark"
                    : "bg-bg-primary-light/95 border-border-light"
            }`}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div
                className={`p-4 border-b ${
                    isDark ? "border-border-dark" : "border-border-light"
                }`}
            >
                <h3
                    className={`font-semibold text-sm uppercase tracking-wide ${
                        isDark ? "text-text-primary-dark" : "text-text-primary-light"
                    }`}
                >
                    Question Palette
                </h3>
                {viewMode === "exam" && (
                    <div
                        className={`mt-2 text-xs ${
                            isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}
                    >
                        {questions.length} Questions
                    </div>
                )}
            </div>

            {/* Status Legend */}
            <div
                className={`p-4 border-b space-y-2 ${
                    isDark ? "border-border-dark" : "border-border-light"
                }`}
            >
                <div className="flex items-center justify-between text-xs">
                    <span
                        className={
                            isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }
                    >
                        Answered
                    </span>
                    <span className="font-medium text-success">{stats.answered}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span
                        className={
                            isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }
                    >
                        Marked
                    </span>
                    <span className="font-medium text-info">{stats.marked}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span
                        className={
                            isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }
                    >
                        Not Visited
                    </span>
                    <span
                        className={`font-medium ${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                    >
                        {stats.notVisited}
                    </span>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, i) => (
                        <motion.button
                            key={q.id}
                            onClick={() => dispatch(setCurrentQuestionIndex(i))}
                            className={`
                                aspect-square flex items-center justify-center rounded-lg font-medium text-sm border-2 transition-all duration-200
                                ${getStatusColor(q.id)}
                                ${
                                                                    currentIndex === i
                                                                        ? "ring-2 ring-brand-accent-light ring-offset-2 dark:ring-offset-dark"
                                                                        : ""
                                                                }
                            `}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {i + 1}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div
                className={`p-4 border-t ${
                    isDark ? "border-border-dark" : "border-border-light"
                }`}
            >
                <div className="text-xs font-medium uppercase tracking-wide">
                    Total: {questions.length} Questions
                </div>
            </div>
        </motion.div>
    );
};

export default QuestionPalette;
