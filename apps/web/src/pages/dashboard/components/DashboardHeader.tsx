import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { UserProfile } from "../../../types";

interface DashboardHeaderProps {
    userProfile: UserProfile;
    isDark: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    userProfile,
    isDark,
}) => {
    const displayName = userProfile.display_name ?? userProfile.username;
    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");

    // Calculate "Active this week" micro stat
    const activeThisWeek = useMemo(() => {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getUTCDay());
        // Mock data - in real app this would come from analytics
        // Use a deterministic value for consistency during development
        const dayOfMonth = now.getDate();
        return (dayOfMonth % 7) + 3; // 3-9 days based on current date
    }, []);

    // Plan badge styling
    const getPlanBadgeClass = () => {
        const baseClass = "px-2 py-1 rounded-lg text-xs font-medium";
        switch (userProfile.subscription_tier) {
            case "pro":
                return `${baseClass} ${isDark ? "bg-brand-primary-dark/20 text-brand-primary-dark" : "bg-brand-primary-light/20 text-brand-primary-light"}`;
            case "premium":
                return `${baseClass} ${isDark ? "bg-brand-accent-dark/20 text-brand-accent-dark" : "bg-brand-accent-light/20 text-brand-accent-light"}`;
            default:
                return `${baseClass} ${isDark ? "bg-bg-tertiary-dark text-text-muted-dark" : "bg-bg-tertiary-light text-text-muted-light"}`;
        }
    };

    return (
        <motion.header
            className={`dashboard-panel ${
                isDark ? "dashboard-panel-dark" : "dashboard-panel-light"
            } p-6`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
        >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                {/* User Identity Section */}
                <div className="flex items-start gap-5">
                    <div className="shrink-0">
                        {userProfile.avatar_url ? (
                            <img
                                src={userProfile.avatar_url}
                                alt={`${displayName} avatar`}
                                className={`w-16 h-16 rounded-2xl object-cover border shadow-sm ${
                                    isDark ? "border-border-dark" : "border-border-light"
                                }`}
                            />
                        ) : (
                            <div
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center border font-semibold text-lg ${
                                    isDark
                                        ? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark"
                                        : "bg-bg-tertiary-light border-border-light text-text-primary-light"
                                }`}
                            >
                                {initials || "U"}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <h1
                                className={`text-2xl sm:text-3xl font-bold text-heading truncate ${
                                    isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                            >
                                {displayName}
                            </h1>
                            <span className={getPlanBadgeClass()}>
                                {userProfile.subscription_tier.toUpperCase()}
                            </span>
                        </div>

                        <div
                            className={`flex items-center gap-4 text-sm ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                        >
                            <span>@{userProfile.username}</span>
                            <span className="flex items-center gap-1">
                                <span className="text-brand-primary-light dark:text-brand-primary-dark">📊</span>
                                Active this week: {activeThisWeek} days
                            </span>
                        </div>
                    </div>
                </div>

                {/* Goal & Progress Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 sm:min-w-[280px]">
                    <div
                        className={`rounded-xl border px-4 py-3 ${
                            isDark
                                ? "border-border-dark bg-bg-tertiary-dark/40"
                                : "border-border-light bg-bg-tertiary-light/50"
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-brand-primary-light dark:text-brand-primary-dark text-sm">⏱️</span>
                            <div
                                className={`text-xs font-medium uppercase tracking-wide ${
                                    isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                }`}
                            >
                                Daily goal
                            </div>
                        </div>
                        <div
                            className={`text-xl font-bold ${
                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                        >
                            {userProfile.daily_goal_minutes} min
                        </div>
                    </div>

                    <div
                        className={`rounded-xl border px-4 py-3 ${
                            isDark
                                ? "border-border-dark bg-bg-tertiary-dark/40"
                                : "border-border-light bg-bg-tertiary-light/50"
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-brand-accent-light dark:text-brand-accent-dark text-sm">🎯</span>
                            <div
                                className={`text-xs font-medium uppercase tracking-wide ${
                                    isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                }`}
                            >
                                Status
                            </div>
                        </div>
                        <div
                            className={`text-xl font-bold ${
                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                        >
                            On Track
                        </div>
                    </div>
                </div>
            </div>
        </motion.header>
    );
};
