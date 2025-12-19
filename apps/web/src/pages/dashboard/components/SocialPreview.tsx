import React from "react";
import type { LeaderboardEntry } from "../../../types";

interface SocialPreviewProps {
    leaderboard: LeaderboardEntry[];
    isDark: boolean;
}

export const SocialPreview: React.FC<SocialPreviewProps> = ({
    leaderboard,
    isDark,
}) => {
    return (
        <section
            className={`dashboard-panel ${
                isDark ? "dashboard-panel-dark" : "dashboard-panel-light"
            } p-4 sm:p-5`}
        >
            <h2
                className={`dashboard-section-title ${
                    isDark ? "text-text-primary-dark" : "text-text-primary-light"
                }`}
            >
                Social (preview)
            </h2>
            <p
                className={`mt-1 text-sm ${
                    isDark ? "text-text-muted-dark" : "text-text-muted-light"
                }`}
            >
                Peers practiced today. Compare progress is coming soon.
            </p>

            <div
                className={`mt-4 rounded-xl border ${
                    isDark
                        ? "border-border-dark bg-bg-tertiary-dark/40"
                        : "border-border-light bg-bg-tertiary-light/50"
                }`}
            >
                <div className="px-4 py-3 flex items-center justify-between">
                    <div
                        className={`text-sm font-semibold ${
                            isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}
                    >
                        Peers practiced today
                    </div>
                    <div
                        className={`text-xs ${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                    >
                        Daily
                    </div>
                </div>
                <ul className="px-4 pb-3 space-y-2">
                    {leaderboard
                        .slice(0, 3)
                        .map((e) => (
                            <li
                                key={e.id}
                                className="flex items-center justify-between text-sm"
                            >
                                <div
                                    className={`flex items-center gap-2 ${
                                        isDark
                                            ? "text-text-secondary-dark"
                                            : "text-text-secondary-light"
                                    }`}
                                >
                                    <span
                                        className={`w-6 text-xs ${
                                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                        }`}
                                    >
                                        #{e.rank}
                                    </span>
                                    <span>User {e.user_id.slice(-4)}</span>
                                </div>
                                <div
                                    className={`text-xs ${
                                        isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                    }`}
                                >
                                    Score {e.score} • {e.accuracy_percentage ?? 0}%
                                </div>
                            </li>
                        ))}
                </ul>
            </div>

            <div
                className={`mt-4 rounded-xl border px-4 py-3 ${
                    isDark
                        ? "border-border-dark bg-bg-tertiary-dark/40"
                        : "border-border-light bg-bg-tertiary-light/50"
                }`}
            >
                <div
                    className={`text-sm font-semibold ${
                        isDark ? "text-text-primary-dark" : "text-text-primary-light"
                    }`}
                >
                    Compare progress (coming soon)
                </div>
                <div
                    className={`mt-1 text-sm ${
                        isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                    }`}
                >
                    You’ll be able to compare consistency and accuracy with peers in your cohort.
                </div>
            </div>
        </section>
    );
};
