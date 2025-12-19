import React from "react";
import { motion } from "framer-motion";

interface Action {
    action: string;
    details: string;
    priority: "high" | "medium" | "low";
}

interface NextStepsProps {
    data: Action[];
}

export const NextSteps: React.FC<NextStepsProps> = ({ data }) => {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "bg-error/10 border-error/30 text-error";
            case "medium":
                return "bg-warning/10 border-warning/30 text-warning";
            case "low":
                return "bg-info/10 border-info/30 text-info";
            default:
                return "bg-text-muted-light/10 border-text-muted-light/30 text-text-muted-light dark:bg-text-muted-dark/10 dark:border-text-muted-dark/30 dark:text-text-muted-dark";
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case "high":
                return "🔴";
            case "medium":
                return "🟡";
            case "low":
                return "🔵";
            default:
                return "⚪";
        }
    };

    // Sort by priority: high, medium, low
    const sortedActions = [...data].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-bg-secondary-light dark:bg-bg-secondary-dark border border-border-light dark:border-border-dark rounded-xl p-6"
        >
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 flex items-center">
                    <span className="mr-2">🎯</span>
                    What to Do Next
                </h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Based on your performance, here's what will help you improve most effectively
                </p>
            </div>

            <div className="space-y-4">
                {sortedActions.map((item, index) => (
                    <motion.div
                        key={`${item.action}-${index}`}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`
                            ${getPriorityColor(item.priority)}
                            border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer
                            group
                        `}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center mb-2">
                                    <span className="mr-2">{getPriorityIcon(item.priority)}</span>
                                    <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark group-hover:text-brand-primary-light dark:group-hover:text-brand-primary-dark transition-colors">
                                        {item.action}
                                    </h3>
                                </div>
                                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                                    {item.details}
                                </p>
                                
                                {/* Action Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="text-xs font-medium px-3 py-1.5 rounded-md bg-brand-primary-light dark:bg-brand-primary-dark text-white hover:bg-brand-primary-hover-light dark:hover:bg-brand-primary-hover-dark transition-all duration-200"
                                    onClick={() => {
                                        // TODO: Implement navigation to appropriate practice section
                                        console.log(`Starting action: ${item.action}`);
                                    }}
                                >
                                    Start Now
                                </motion.button>
                            </div>
                            
                            <div className="ml-4 flex-shrink-0">
                                <div className={`
                                    text-xs font-medium px-2 py-1 rounded-full
                                    bg-bg-primary-light dark:bg-bg-primary-dark
                                    text-text-primary-light dark:text-text-primary-dark
                                `}>
                                    {item.priority.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Action Summary */}
            <div className="mt-6 p-4 bg-bg-primary-light dark:bg-bg-primary-dark rounded-lg border border-border-lighter dark:border-border-darker">
                <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    📋 Today's Focus
                </h4>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    Start with the high-priority action above. Even 15 minutes of focused practice 
                    on your weakest area will be more valuable than an hour of random review.
                </p>
            </div>

            {/* Motivation Line */}
            <div className="mt-4 text-center">
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                    💡 <em>Remember: Consistency beats perfection. Small daily steps lead to big improvements.</em>
                </p>
            </div>
        </motion.div>
    );
};