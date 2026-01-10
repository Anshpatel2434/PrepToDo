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
            className={`flex items-center gap-2 p-2 rounded-lg border ${
                isDark
                    ? "bg-bg-tertiary-dark border-border-dark"
                    : "bg-bg-tertiary-light border-border-light"
            }`}
        >
            <div
                className={`p-1 rounded-lg ${
                    isDark ? "bg-bg-secondary-dark" : "bg-bg-secondary-light"
                }`}
            >
                {icon}
            </div>
            <div className="min-w-0">
                <div
                    className={`text-[10px] uppercase tracking-widest font-semibold ${
                        isDark ? "text-text-muted-dark" : "text-text-muted-light"
                    }`}
                >
                    {label}
                </div>
                <div
                    className={`text-xs font-semibold truncate ${
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
            className={`rounded-2xl border p-5 transition-colors ${
                isDark
                    ? "bg-bg-secondary-dark border-border-dark"
                    : "bg-bg-secondary-light border-border-light"
            }`}
        >
            {isLoadingProfile && !profile ? (
                <div className="space-y-4">
                    <div className="animate-pulse h-6 w-48 rounded bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                    <div className="animate-pulse h-4 w-72 rounded bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="animate-pulse h-12 rounded-lg bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60"
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
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
                                        ? <>
                                            <span className="font-medium">Subscription:</span> {profile.subscription_tier} •
                                            <span className="font-medium">Daily Goal:</span> {profile.daily_goal_minutes} min/day •
                                            <span className="font-medium">Difficulty:</span> {profile.preferred_difficulty}
                                          </>
                                        : "Loading your preferences…"}
                                </div>
                            </div>
                        </div>

                        <div
                            className={`text-sm sm:text-right w-full sm:w-auto mt-3 sm:mt-0 ${
                                isDark
                                    ? "text-text-secondary-dark"
                                    : "text-text-secondary-light"
                            }`}
                        >
                            <div className="font-semibold">Last {analytics?.length ?? 0} days</div>
                            <div className="text-xs">
                                {summary.minutes} min • {summary.questions} Qs • {summary.accuracy}% acc
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
                        <Stat
                            label="Current Practice Streak"
                            value={latest ? `${latest.current_streak} days` : "—"}
                            icon={<MdLocalFireDepartment size={18} />}
                            isDark={isDark}
                        />
                        <Stat
                            label="Longest Practice Streak"
                            value={latest ? `${latest.longest_streak} days` : "—"}
                            icon={<MdLocalFireDepartment size={18} />}
                            isDark={isDark}
                        />
                        <Stat
                            label="Total Achievement Points"
                            value={latest ? latest.total_points : "—"}
                            icon={<MdStars size={18} />}
                            isDark={isDark}
                        />
                        <Stat
                            label="Practice Time Today"
                            value={today ? `${today.minutes_practiced} minutes` : "0 minutes"}
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
