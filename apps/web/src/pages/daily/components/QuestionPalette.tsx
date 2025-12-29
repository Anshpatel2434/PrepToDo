import React from "react";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import {
    selectAttempts,
    selectCurrentQuestionIndex,
    setCurrentQuestionIndex,
    selectViewMode,
    selectQuestionOrder,
} from "../redux_usecase/dailyPracticeSlice";

interface QuestionPaletteProps {
    isDark: boolean;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({ isDark }) => {
    const dispatch = useDispatch();
    const questionOrder = useSelector(selectQuestionOrder);
    const attempts = useSelector(selectAttempts);
    const currentIndex = useSelector(selectCurrentQuestionIndex);
    const viewMode = useSelector(selectViewMode);

    // Helper to get status from attempt
    const getStatus = (questionId: string): 'answered' | 'marked_for_review' | 'not_visited' => {
        const attempt = attempts[questionId];
        if (!attempt) return 'not_visited';
        if (attempt.marked_for_review) return 'marked_for_review';
        const userAnswer = attempt.user_answer as any;
        if (userAnswer?.user_answer != null) return 'answered';
        return 'not_visited';
    };

    const getStatusColor = (questionId: string): string => {
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

    const handleQuestionClick = (index: number) => {
        dispatch(setCurrentQuestionIndex(index));
    };

    // Count statuses
    const statusCounts = {
        answered: Object.values(attempts).filter((a) => {
            const userAnswer = a.user_answer as any;
            return userAnswer?.user_answer != null && !a.marked_for_review;
        }).length,
        marked: Object.values(attempts).filter((a) => a.marked_for_review).length,
        notVisited: questionOrder.length - Object.keys(attempts).length,
    };

    return (
        <motion.div
            className={`
                h-full w-64 shrink-0
                backdrop-blur-xl border-l shadow-xl
                ${
                                    isDark
                                        ? "bg-bg-primary-dark/95 border-border-dark"
                                        : "bg-bg-primary-light/95 border-border-light"
                                }
                flex flex-col
            `}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div
                className={`
                p-4 border-b
                ${isDark ? "border-border-dark" : "border-border-light"}
            `}
            >
                <h3
                    className={`
                    font-semibold text-sm uppercase tracking-wide
                    ${
                                            isDark
                                                ? "text-text-primary-dark"
                                                : "text-text-primary-light"
                                        }
                `}
                >
                    Question Palette
                </h3>
                {viewMode === "exam" && (
                    <div
                        className={`
                        mt-2 text-xs
                        ${
                                                    isDark
                                                        ? "text-text-secondary-dark"
                                                        : "text-text-secondary-light"
                                                }
                    `}
                    >
                        {questionOrder.length} Questions
                    </div>
                )}
            </div>

            {/* Status Legend */}
            <div
                className={`
                p-4 border-b space-y-2
                ${isDark ? "border-border-dark" : "border-border-light"}
            `}
            >
                <div className="flex items-center justify-between text-xs">
                    <span
                        className={
                            isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }
                    >
                        Answered
                    </span>
                    <span
                        className={`font-medium ${
                            isDark ? "text-success" : "text-success"
                        }`}
                    >
                        {statusCounts.answered}
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span
                        className={
                            isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }
                    >
                        Marked
                    </span>
                    <span className={`font-medium ${isDark ? "text-info" : "text-info"}`}>
                        {statusCounts.marked}
                    </span>
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
                        {statusCounts.notVisited}
                    </span>
                </div>
            </div>

            {/* Question Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-5 gap-2">
                    {questionOrder.map((questionId, index) => (
                        <motion.button
                            key={questionId}
                            onClick={() => handleQuestionClick(index)}
                            className={`
                                    aspect-square flex items-center justify-center
                                    rounded-lg font-medium text-sm
                                    border-2 transition-all duration-200
                                    ${getStatusColor(questionId)}
                                    ${
                                                                        currentIndex === index
                                                                            ? "ring-2 ring-brand-accent-light ring-offset-2 dark:ring-offset-dark"
                                                                            : ""
                                                                    }
                                    ${
                                                                        currentIndex === index && isDark
                                                                            ? "ring-brand-accent-dark"
                                                                            : ""
                                                                    }
                                `}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {index + 1}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Status Summary Footer */}
            <div
                className={`
                    p-4 border-t
                    ${isDark ? "border-border-dark" : "border-border-light"}
                `}
            >
                <div className="text-xs font-medium uppercase tracking-wide mb-2">
                    Total: {questionOrder.length} Questions
                </div>
            </div>
        </motion.div>
    );
};

export default QuestionPalette;
