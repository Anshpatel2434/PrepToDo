import React, { useMemo } from "react";
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
        { label: "Questions attempted", value: totals.totalQuestions.toLocaleString() },
        { label: "Overall accuracy", value: `${totals.accuracy}%` },
        { label: "Minutes practiced", value: totals.totalMinutes.toLocaleString() },
        { label: "Current streak", value: `${totals.currentStreak}` },
    ] as const;

    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => (
                <div
                    key={c.label}
                    className={`dashboard-panel ${
                        isDark ? "dashboard-panel-dark" : "dashboard-panel-light"
                    } p-4`}
                >
                    <div
                        className={`text-xs uppercase tracking-wide ${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                    >
                        {c.label}
                    </div>
                    <div
                        className={`mt-2 text-2xl sm:text-3xl font-semibold ${
                            isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}
                    >
                        {c.value}
                    </div>
                </div>
            ))}
        </section>
    );
};
