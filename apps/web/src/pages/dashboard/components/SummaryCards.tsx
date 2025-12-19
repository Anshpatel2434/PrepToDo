import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { PracticeSession, UserAnalytics } from "../../../types";

interface SummaryCardsProps {
    analytics: UserAnalytics[];
    sessions: PracticeSession[];
    isDark: boolean;
}

const latestByDate = (items: UserAnalytics[]) => {
    return items.reduce<UserAnalytics | null>((latest, a) => {
        if (!latest) return a;
        return a.date > latest.date ? a : latest;
    }, null);
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({
    analytics,
    sessions,
    isDark,
}) => {
    const totals = useMemo(() => {
        const totalQuestions = analytics.reduce(
            (acc, a) => acc + a.questions_attempted,
            0
        );
        const totalCorrect = analytics.reduce(
            (acc, a) => acc + a.questions_correct,
            0
        );
        const accuracy =
            totalQuestions === 0
                ? 0
                : Math.round((totalCorrect / totalQuestions) * 100);

        const totalMinutesFromAnalytics = analytics.reduce(
            (acc, a) => acc + a.minutes_practiced,
            0
        );
        const totalMinutesFromSessions = Math.round(
            sessions.reduce((acc, s) => acc + s.time_spent_seconds, 0) / 60
        );
        const totalMinutes = Math.max(totalMinutesFromAnalytics, totalMinutesFromSessions);

        const latest = latestByDate(analytics);
        const currentStreak = latest?.current_streak ?? 0;

        return {
            totalQuestions,
            accuracy,
            totalMinutes,
            currentStreak,
        };
    }, [analytics, sessions]);

    const cards = [
        { 
            icon: "📊", 
            label: "Questions attempted", 
            value: totals.totalQuestions.toLocaleString(), 
            unit: "",
            description: "Total practice questions"
        },
        { 
            icon: "🎯", 
            label: "Overall accuracy", 
            value: `${totals.accuracy}%`, 
            unit: "%",
            description: "Correct answer rate"
        },
        { 
            icon: "⏱️", 
            label: "Minutes practiced", 
            value: totals.totalMinutes.toLocaleString(), 
            unit: "min",
            description: "Total study time"
        },
        { 
            icon: "🔥", 
            label: "Current streak", 
            value: `${totals.currentStreak}`, 
            unit: "days",
            description: "Consecutive active days"
        },
    ] as const;

    return (
        <motion.section 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.1 }}
        >
            {cards.map((c, index) => (
                <motion.div
                    key={c.label}
                    className={`dashboard-panel ${
                        isDark ? "dashboard-panel-dark" : "dashboard-panel-light"
                    } p-5 hover:shadow-sm transition-shadow`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut", delay: 0.1 + index * 0.05 }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{c.icon}</span>
                        <div
                            className={`text-sm font-medium ${
                                isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                            }`}
                        >
                            {c.label}
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <div
                            className={`text-3xl font-bold ${
                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                        >
                            {c.value}
                            {c.unit && (
                                <span
                                    className={`text-lg font-medium ml-1 ${
                                        isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                    }`}
                                >
                                    {c.unit}
                                </span>
                            )}
                        </div>
                        <div
                            className={`text-xs ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                        >
                            {c.description}
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.section>
    );
};
