import React from "react";
import { motion } from "framer-motion";

interface ProgressData {
    weeklyTrend: Array<{
        week: string;
        accuracy: number;
        questions: number;
    }>;
}

interface ProgressChartProps {
    data: ProgressData;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
    // For now, showing placeholder UI since charts are not ready
    // This clearly indicates what will appear later

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-bg-secondary-light dark:bg-bg-secondary-dark border border-border-light dark:border-border-dark rounded-xl p-6"
        >
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                    Progress Over Time
                </h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Track your improvement trends and identify patterns in your learning journey
                </p>
            </div>

            {/* Placeholder Chart Area */}
            <div className="relative bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded-lg p-8 text-center">
                {/* Placeholder SVG representation */}
                <div className="flex items-end justify-between h-32 mb-4">
                    {data.weeklyTrend.map((week) => (
                        <div key={week.week} className="flex flex-col items-center flex-1">
                            <div
                                className="bg-brand-primary-light dark:bg-brand-primary-dark w-8 rounded-t opacity-20"
                                style={{
                                    height: `${(week.accuracy / 100) * 100}px`,
                                }}
                            />
                            <div className="mt-2 text-xs text-text-muted-light dark:text-text-muted-dark">
                                {week.week.replace("Week ", "W")}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info Text */}
                <div className="space-y-2">
                    <div className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                        Interactive progress charts coming soon
                    </div>
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        You'll see detailed accuracy trends, question volume, and improvement patterns here
                    </div>
                </div>

                {/* Sample Data Preview */}
                <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-bg-primary-light dark:bg-bg-primary-dark rounded p-3">
                        <div className="font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                            Accuracy Trend
                        </div>
                        <div className="text-text-secondary-light dark:text-text-secondary-dark">
                            {data.weeklyTrend[0].accuracy}% → {data.weeklyTrend[3].accuracy}%
                        </div>
                    </div>
                    <div className="bg-bg-primary-light dark:bg-bg-primary-dark rounded p-3">
                        <div className="font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                            Questions This Month
                        </div>
                        <div className="text-text-secondary-light dark:text-text-secondary-dark">
                            {data.weeklyTrend.reduce((sum, week) => sum + week.questions, 0)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Breakdown */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {data.weeklyTrend.map((week, index) => (
                    <motion.div
                        key={week.week}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="bg-bg-primary-light dark:bg-bg-primary-dark rounded-lg p-4 text-center"
                    >
                        <div className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                            {week.week}
                        </div>
                        <div className="text-lg font-bold text-brand-primary-light dark:text-brand-primary-dark">
                            {week.accuracy}%
                        </div>
                        <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                            {week.questions} questions
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};