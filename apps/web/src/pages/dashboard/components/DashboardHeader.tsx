import React from "react";
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

    return (
        <header
            className={`dashboard-panel ${
                isDark ? "dashboard-panel-dark" : "dashboard-panel-light"
            } p-4 sm:p-6`}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="shrink-0">
                        {userProfile.avatar_url ? (
                            <img
                                src={userProfile.avatar_url}
                                alt={`${displayName} avatar`}
                                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border ${
                                    isDark ? "border-border-dark" : "border-border-light"
                                }`}
                            />
                        ) : (
                            <div
                                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border font-semibold ${
                                    isDark
                                            ? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark"
                                            : "bg-bg-tertiary-light border-border-light text-text-primary-light"
                                }`}
                            >
                                {initials || "U"}
                            </div>
                        )}
                    </div>

                    <div>
                        <div
                            className={`text-xl sm:text-2xl font-semibold text-heading ${
                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                        >
                            {displayName}
                        </div>
                        <div
                            className={`text-sm ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                        >
                            @{userProfile.username} • {userProfile.subscription_tier.toUpperCase()}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4">
                    <div
                        className={`rounded-xl border px-3 py-2 ${
                            isDark
                                ? "border-border-dark bg-bg-tertiary-dark/40"
                                : "border-border-light bg-bg-tertiary-light/50"
                        }`}
                    >
                        <div
                            className={`text-xs ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                        >
                            Daily goal
                        </div>
                        <div
                            className={`text-sm font-semibold ${
                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                        >
                            {userProfile.daily_goal_minutes} min
                        </div>
                    </div>

                    <div
                        className={`rounded-xl border px-3 py-2 ${
                            isDark
                                ? "border-border-dark bg-bg-tertiary-dark/40"
                                : "border-border-light bg-bg-tertiary-light/50"
                        }`}
                    >
                        <div
                            className={`text-xs ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                        >
                            Plan
                        </div>
                        <div
                            className={`text-sm font-semibold ${
                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                        >
                            {userProfile.subscription_tier.toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
