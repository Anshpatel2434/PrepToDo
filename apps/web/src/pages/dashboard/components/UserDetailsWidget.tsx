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
    analytics: UserAnalytics | null | undefined;
    isLoadingProfile: boolean;
    isLoadingAnalytics: boolean;
    isDark: boolean;
}

function Stat({
    label,
    value,
    icon,
    isDark,
    highlight = false,
}: {
    label: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    isDark: boolean;
    highlight?: boolean;
}) {
    return (
        <div
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${highlight
                    ? isDark
                        ? "bg-gradient-to-br from-brand-primary-dark/10 to-brand-accent-dark/10 border-brand-primary-dark/30 shadow-lg shadow-brand-primary-dark/10"
                        : "bg-gradient-to-br from-brand-primary-light/10 to-brand-accent-light/10 border-brand-primary-light/30 shadow-lg shadow-brand-primary-light/10"
                    : isDark
                        ? "bg-bg-tertiary-dark border-border-dark hover:border-border-darker"
                        : "bg-bg-tertiary-light border-border-light hover:border-gray-300"
                }`}
        >
            <div
                className={`p-3 rounded-xl ${highlight
                    ? isDark
                        ? "bg-brand-primary-dark/20"
                        : "bg-brand-primary-light/20"
                    : isDark
                        ? "bg-bg-secondary-dark"
                        : "bg-bg-secondary-light"
                    }`}
            >
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <div
                    className={`text-xs uppercase tracking-wider font-semibold mb-1 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                >
                    {label}
                </div>
                <div
                    className={`text-lg font-bold truncate ${highlight
                        ? isDark
                            ? "text-brand-accent-dark"
                            : "text-brand-accent-light"
                        : isDark
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

    // Check if user practiced today
    const practicedToday = React.useMemo(() => {
        if (!analytics) return false;
        return analytics.last_active_date === todayKey;
    }, [analytics, todayKey]);

    const name = profile?.display_name || profile?.username || "Your Profile";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-2xl border p-8 transition-all duration-300 shadow-lg ${isDark
                ? "bg-bg-secondary-dark border-border-dark hover:shadow-brand-primary-dark/10"
                : "bg-bg-secondary-light border-border-light hover:shadow-brand-primary-light/10"
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
                    <div className="flex items-start justify-between gap-6 mb-6">
                        <div className="flex items-center gap-5 min-w-0">
                            <div className="relative">
                                <div
                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-md ${isDark
                                        ? "bg-bg-tertiary-dark border-border-dark"
                                        : "bg-bg-tertiary-light border-border-light"
                                        }`}
                                >
                                    {profile?.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt={name}
                                            className="w-16 h-16 rounded-2xl object-cover"
                                        />
                                    ) : (
                                        <MdPerson
                                            className={
                                                isDark
                                                    ? "text-brand-primary-dark"
                                                    : "text-brand-primary-light"
                                            }
                                            size={28}
                                        />
                                    )}
                                </div>
                                {practicedToday && (
                                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 ${isDark
                                            ? "bg-brand-accent-dark border-bg-secondary-dark"
                                            : "bg-brand-accent-light border-bg-secondary-light"
                                        } shadow-lg`} title="Practiced today!" />
                                )}
                            </div>

                            <div className="min-w-0">
                                <h2
                                    className={`font-serif font-bold text-3xl truncate ${isDark
                                        ? "text-text-primary-dark"
                                        : "text-text-primary-light"
                                        }`}
                                >
                                    {name}
                                </h2>
                                <div
                                    className={`text-sm mt-1.5 ${isDark
                                        ? "text-text-secondary-dark"
                                        : "text-text-secondary-light"
                                        }`}
                                >
                                    {profile
                                        ? `${profile.subscription_tier} • ${profile.daily_goal_minutes} min/day goal • ${profile.preferred_difficulty} difficulty`
                                        : "Loading your preferences…"}
                                </div>
                            </div>
                        </div>

                        <div
                            className={`text-right text-sm shrink-0 ${isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                                }`}
                        >
                            <div className={`font-bold text-base mb-1 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>Overall Performance</div>
                            <div className="space-y-0.5">
                                <div>{analytics?.minutes_practiced || 0} min practiced</div>
                                <div>{analytics?.questions_attempted || 0} questions</div>
                                <div className={`font-semibold ${isDark ? "text-brand-accent-dark" : "text-brand-accent-light"}`}>
                                    {Math.round(analytics?.accuracy_percentage || 0)}% accuracy
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Stat
                            label="Current Streak"
                            value={analytics ? `${analytics.current_streak} days` : "0 days"}
                            icon={<MdLocalFireDepartment size={22} className={isDark ? "text-orange-400" : "text-orange-500"} />}
                            isDark={isDark}
                            highlight={analytics ? analytics.current_streak > 0 : false}
                        />
                        <Stat
                            label="Longest Streak"
                            value={analytics ? `${analytics.longest_streak} days` : "0 days"}
                            icon={<MdLocalFireDepartment size={22} className={isDark ? "text-amber-400" : "text-amber-500"} />}
                            isDark={isDark}
                        />
                        <Stat
                            label="Total Points"
                            value={analytics ? analytics.total_points.toLocaleString() : "0"}
                            icon={<MdStars size={22} className={isDark ? "text-yellow-400" : "text-yellow-500"} />}
                            isDark={isDark}
                        />
                        <Stat
                            label="Today's Points"
                            value={practicedToday && analytics ? analytics.points_earned_today.toLocaleString() : "0"}
                            icon={<MdTimer size={22} className={isDark ? "text-blue-400" : "text-blue-500"} />}
                            isDark={isDark}
                            highlight={practicedToday}
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
