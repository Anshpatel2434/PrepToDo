import React from "react";
import { motion } from "framer-motion";

interface TopicPerformance {
    topic: string;
    accuracy: number;
}

interface StrengthWeaknessData {
    strengths: TopicPerformance[];
    weaknesses: TopicPerformance[];
}

interface StrengthWeaknessProps {
    data: StrengthWeaknessData;
}

export const StrengthWeakness: React.FC<StrengthWeaknessProps> = ({ data }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths Section */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-bg-secondary-light dark:bg-bg-secondary-dark border border-border-light dark:border-border-dark rounded-xl p-6"
            >
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 flex items-center">
                        <span className="mr-2">💪</span>
                        Your Strong Areas
                    </h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        Topics where you're performing well - build on these foundations
                    </p>
                </div>

                <div className="space-y-4">
                    {data.strengths.map((item, index) => (
                        <motion.div
                            key={item.topic}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="flex items-center justify-between"
                        >
                            <div className="flex-1">
                                <div className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                                    {item.topic}
                                </div>
                                <div className="w-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded-full h-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.accuracy}%` }}
                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                        className="bg-brand-primary-light dark:bg-brand-primary-dark h-2 rounded-full"
                                    />
                                </div>
                            </div>
                            <div className="ml-4 text-right">
                                <div className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                                    {item.accuracy}%
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-4 p-3 bg-bg-primary-light dark:bg-bg-primary-dark rounded-lg">
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        <strong>Tip:</strong> Continue practicing these areas to maintain your edge and increase consistency.
                    </p>
                </div>
            </motion.div>

            {/* Weaknesses Section */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-bg-secondary-light dark:bg-bg-secondary-dark border border-border-light dark:border-border-dark rounded-xl p-6"
            >
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 flex items-center">
                        <span className="mr-2">🎯</span>
                        Focus Areas
                    </h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        Opportunities for improvement - every expert was once a beginner
                    </p>
                </div>

                <div className="space-y-4">
                    {data.weaknesses.map((item, index) => (
                        <motion.div
                            key={item.topic}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="flex items-center justify-between"
                        >
                            <div className="flex-1">
                                <div className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                                    {item.topic}
                                </div>
                                <div className="w-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded-full h-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.accuracy}%` }}
                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                        className="bg-brand-accent-light dark:bg-brand-accent-dark h-2 rounded-full"
                                    />
                                </div>
                            </div>
                            <div className="ml-4 text-right">
                                <div className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                                    {item.accuracy}%
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-4 p-3 bg-bg-primary-light dark:bg-bg-primary-dark rounded-lg">
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        <strong>Opportunity:</strong> These areas show the most potential for quick improvement with focused practice.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};