import React from "react";
import { motion } from "framer-motion";

interface SummaryData {
    totalQuestions: number;
    overallAccuracy: number;
    totalMinutes: number;
    currentStreak: number;
}

interface SummaryCardsProps {
    data: SummaryData;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ data }) => {
    const cards = [
        {
            label: "Questions Attempted",
            value: data.totalQuestions,
            suffix: "",
            icon: "📝",
            color: "brand-primary",
        },
        {
            label: "Overall Accuracy",
            value: data.overallAccuracy,
            suffix: "%",
            icon: "🎯",
            color: "brand-accent",
        },
        {
            label: "Minutes Practiced",
            value: data.totalMinutes,
            suffix: "m",
            icon: "⏱️",
            color: "brand-secondary",
        },
        {
            label: "Current Streak",
            value: data.currentStreak,
            suffix: " days",
            icon: "🔥",
            color: "warning",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-bg-secondary-light dark:bg-bg-secondary-dark border border-border-light dark:border-border-dark rounded-xl p-6 text-center hover:shadow-lg transition-all duration-200"
                >
                    <div className="text-2xl mb-2">{card.icon}</div>
                    <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-1">
                        {card.value}
                        <span className="text-lg font-normal text-text-muted-light dark:text-text-muted-dark">
                            {card.suffix}
                        </span>
                    </div>
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {card.label}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};