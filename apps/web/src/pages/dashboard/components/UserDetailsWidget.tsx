import React from "react";
import { motion } from "framer-motion";
import {
    MdPerson,
    MdLocalFireDepartment,
    MdStars,
    MdTimer,
} from "react-icons/md";
import type { UserAnalytics, UserProfile } from "../../../types";

interface UserDetailsWidgetProps {
    profile: UserProfile | null | undefined;
    analytics: UserAnalytics[] | undefined;
    isLoadingProfile: boolean;
    isLoadingAnalytics: boolean;
    isDark: boolean;
}

function Stat({
    label,
    value,
    icon,
    isDark,
}: {
    label: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    isDark: boolean;
}) {
    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl border ${
                isDark
                    ? "bg-bg-tertiary-dark border-border-dark"
                    : "bg-bg-tertiary-light border-border-light"
            }`}
        >
            <div
                className={`p-2 rounded-lg ${
                    isDark ? "bg-bg-secondary-dark" : "bg-bg-secondary-light"
                }`}
            >
                {icon}
            </div>
            <div className="min-w-0">
                <div
                    className={`text-xs uppercase tracking-widest font-semibold ${
                        isDark ? "text-text-muted-dark" : "text-text-muted-light"
                    }`}
                >
                    {label}
                </div>
                <div
                    className={`text-sm font-semibold truncate ${
                        isDark
                            ? "text-text-primary-dark"
                            : "text-text-primary-light"
                    }`}
                >
                    {value}
                </div>
            </div>
        </div>
    );
}

export const UserDetailsWidget: React.FC<UserDetailsWidgetProps> = ({
    profile,
    analytics,
    isLoadingProfile,
    isLoadingAnalytics,
    isDark,
}) => {
    const todayKey = React.useMemo(
        () => new Date().toISOString().split("T")[0],
        []
    );

    const latest = React.useMemo(() => {
        if (!analytics || analytics.length === 0) return null;
        return analytics[analytics.length - 1];
    }, [analytics]);

    const today = React.useMemo(() => {
        if (!analytics || analytics.length === 0) return null;
        return analytics.find((a) => a.date === todayKey) ?? null;
    }, [analytics, todayKey]);

    const summary = React.useMemo(() => {
        const list = analytics ?? [];
        const minutes = list.reduce((acc, a) => acc + (a.minutes_practiced || 0), 0);
        const questions = list.reduce(
            (acc, a) => acc + (a.questions_attempted || 0),
            0
        );
        const correct = list.reduce((acc, a) => acc + (a.questions_correct || 0), 0);
        const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
        return { minutes, questions, accuracy };
    }, [analytics]);

    const name = profile?.display_name || profile?.username || "Your Profile";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-2xl border p-6 transition-colors ${
                isDark
                    ? "bg-bg-secondary-dark border-border-dark"
                    : "bg-bg-secondary-light border-border-light"
            }`}
        >
            {isLoadingProfile && !profile ? (
                <div className="space-y-4">
                    <div className="animate-pulse h-6 w-48 rounded bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                    <div className="animate-pulse h-4 w-72 rounded bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="animate-pulse h-16 rounded-xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60"
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-start justify-between gap-6">
                        <div className="flex items-center gap-4 min-w-0">
                            <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                                    isDark
                                        ? "bg-bg-tertiary-dark border-border-dark"
                                        : "bg-bg-tertiary-light border-border-light"
                                }`}
                            >
                                {profile?.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={name}
                                        className="w-12 h-12 rounded-2xl object-cover"
                                    />
                                ) : (
                                    <MdPerson
                                        className={
                                            isDark
                                                ? "text-brand-primary-dark"
                                                : "text-brand-primary-light"
                                        }
                                        size={22}
                                    />
                                )}
                            </div>

                            <div className="min-w-0">
                                <h2
                                    className={`font-serif font-bold text-2xl truncate ${
                                        isDark
                                            ? "text-text-primary-dark"
                                            : "text-text-primary-light"
                                    }`}
                                >
                                    {name}
                                </h2>
                                <div
                                    className={`text-sm mt-1 ${
                                        isDark
                                            ? "text-text-secondary-dark"
                                            : "text-text-secondary-light"
                                    }`}
                                >
                                    {profile
                                        ? `${profile.subscription_tier} • goal ${profile.daily_goal_minutes} min/day • ${profile.preferred_difficulty} difficulty`
                                        : "Loading your preferences…"}
                                </div>
                            </div>
                        </div>

                        <div
                            className={`text-right text-sm ${
                                isDark
                                    ? "text-text-secondary-dark"
                                    : "text-text-secondary-light"
                            }`}
                        >
                            <div className="font-semibold">Last {analytics?.length ?? 0} days</div>
                            <div>
                                {summary.minutes} min • {summary.questions} questions • {summary.accuracy}%
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Stat
                            label="Current streak"
                            value={latest ? `${latest.current_streak} days` : "—"}
                            icon={<MdLocalFireDepartment size={18} />}
                            isDark={isDark}
                        />
                        <Stat
                            label="Longest streak"
                            value={latest ? `${latest.longest_streak} days` : "—"}
                            icon={<MdLocalFireDepartment size={18} />}
                            isDark={isDark}
                        />
                        <Stat
                            label="Total points"
                            value={latest ? latest.total_points : "—"}
                            icon={<MdStars size={18} />}
                            isDark={isDark}
                        />
                        <Stat
                            label="Minutes today"
                            value={today ? today.minutes_practiced : 0}
                            icon={<MdTimer size={18} />}
                            isDark={isDark}
                        />
                    </div>

                    {isLoadingAnalytics && !analytics ? (
                        <div className="mt-4 animate-pulse h-4 w-48 rounded bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                    ) : null}
                </>
            )}
        </motion.div>
    );
}
