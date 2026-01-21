import React from "react";
import { motion } from "framer-motion";

interface ScoreCardProps {
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
    correctMarks: number;
    incorrectMarks: number;
    totalMarks: number;
    scoredMarks: number;
    percentage: number;
    isDark: boolean;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
    correctCount,
    incorrectCount,
    unattemptedCount,
    correctMarks,
    incorrectMarks,
    totalMarks,
    scoredMarks,
    percentage,
    isDark,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl p-6 shadow-lg ${isDark ? "bg-bg-secondary-dark" : "bg-bg-secondary-light"
                }`}
        >
            {/* Main Score Display */}
            <div className="text-center mb-6">
                <h2
                    className={`text-sm font-medium mb-2 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}
                >
                    Your Score
                </h2>
                <div className="flex items-baseline justify-center gap-2">
                    <span
                        className={`text-5xl font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                    >
                        {scoredMarks}
                    </span>
                    <span
                        className={`text-3xl ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                    >
                        / {totalMarks}
                    </span>
                </div>
                <div
                    className={`mt-2 text-lg font-semibold ${percentage >= 60
                            ? "text-green-500"
                            : percentage >= 40
                                ? "text-yellow-500"
                                : "text-red-500"
                        }`}
                >
                    {percentage}%
                </div>
            </div>

            {/* Breakdown Table */}
            <div className="space-y-3">
                <div
                    className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span
                            className={`text-sm font-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                        >
                            Correct
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span
                            className={`text-sm ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                }`}
                        >
                            {correctCount} questions
                        </span>
                        <span className="text-sm font-semibold text-green-500">
                            +{correctMarks}
                        </span>
                    </div>
                </div>

                <div
                    className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span
                            className={`text-sm font-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                        >
                            Incorrect
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span
                            className={`text-sm ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                }`}
                        >
                            {incorrectCount} questions
                        </span>
                        <span className="text-sm font-semibold text-red-500">
                            {incorrectMarks}
                        </span>
                    </div>
                </div>

                <div
                    className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span
                            className={`text-sm font-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                        >
                            Unattempted
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span
                            className={`text-sm ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                }`}
                        >
                            {unattemptedCount} questions
                        </span>
                        <span
                            className={`text-sm font-semibold ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                }`}
                        >
                            0
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
