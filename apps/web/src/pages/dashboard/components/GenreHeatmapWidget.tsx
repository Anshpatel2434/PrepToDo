import React from "react";
import { motion } from "framer-motion";
import { MdGridOn } from "react-icons/md";
import type { UserMetricProficiency } from "../../../types";
import { transformHeatmapData } from "../utils/chartHelpers";

interface GenreHeatmapWidgetProps {
    genres: UserMetricProficiency[] | undefined;
    isLoading: boolean;
    isDark: boolean;
    index: number;
    className?: string;
    error?: unknown;
}

function scoreToHeatLevel(score: number) {
    if (score >= 80) return 4;
    if (score >= 60) return 3;
    if (score >= 40) return 2;
    if (score >= 20) return 1;
    return 0;
}

function scoreToHeatClass(score: number, isDark: boolean) {
    const level = scoreToHeatLevel(score);
    return isDark ? `dashboard-heat-${level}-dark` : `dashboard-heat-${level}-light`;
}

export const GenreHeatmapWidget: React.FC<GenreHeatmapWidgetProps> = ({
    genres,
    isLoading,
    isDark,
    index,
    className = "",
    error,
}) => {
    const heatData = React.useMemo(() => {
        const list = transformHeatmapData(genres ?? []);
        return list.sort((a, b) => b.score - a.score);
    }, [genres]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.01 }}
            className={`rounded-2xl border p-6 overflow-hidden transition-all duration-300 shadow-lg ${isDark
                    ? "bg-bg-secondary-dark border-border-dark hover:border-brand-primary-dark/40 hover:shadow-brand-primary-dark/10"
                    : "bg-bg-secondary-light border-border-light hover:border-brand-primary-light/40 hover:shadow-brand-primary-light/10"
                } ${className}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3
                        className={`font-serif font-bold text-xl flex items-center gap-2 ${isDark
                                ? "text-text-primary-dark"
                                : "text-text-primary-light"
                            }`}
                    >
                        <MdGridOn
                            className={
                                isDark
                                    ? "text-brand-primary-dark"
                                    : "text-brand-primary-light"
                            }
                        />
                        Genre Heatmap
                    </h3>
                    <p
                        className={`text-sm mt-1 ${isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                            }`}
                    >
                        Performance across passage genres.
                    </p>
                </div>
            </div>

            <div className="mt-6">
                {error ? (
                    <div
                        className={`text-sm ${isDark ? "text-rose-300" : "text-rose-700"
                            }`}
                    >
                        Error loading genre performance.
                    </div>
                ) : isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="animate-pulse h-16 rounded-xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60"
                            />
                        ))}
                    </div>
                ) : heatData.length === 0 ? (
                    <div
                        className={`text-sm ${isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                            }`}
                    >
                        No genre data yet. Attempt a few RC sets to unlock this view.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {heatData.slice(0, 12).map((g) => {
                            const heatClass = scoreToHeatClass(g.score, isDark);
                            const trendText = g.trend === "improving" ? "Improving" :
                                g.trend === "declining" ? "Declining" : "Stable";
                            const trendColor = g.trend === "improving" ? (isDark ? "text-emerald-400" : "text-emerald-600") :
                                g.trend === "declining" ? (isDark ? "text-rose-400" : "text-rose-600") :
                                    (isDark ? "text-text-muted-dark" : "text-text-muted-light");

                            return (
                                <motion.div
                                    key={g.genre}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    transition={{ duration: 0.2 }}
                                    className={`relative group rounded-xl border p-4 overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 ${heatClass} ${isDark
                                            ? "border-border-dark"
                                            : "border-border-light"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div
                                            className={`text-sm font-semibold truncate ${isDark
                                                    ? "text-text-primary-dark"
                                                    : "text-text-primary-light"
                                                }`}
                                        >
                                            {g.genre}
                                        </div>
                                        <div
                                            className={`text-xs font-semibold ${isDark
                                                    ? "text-text-primary-dark"
                                                    : "text-text-primary-light"
                                                }`}
                                        >
                                            {g.score}/100
                                        </div>
                                    </div>

                                    <div className="mt-2 space-y-1 text-[11px]">
                                        <div className={isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}>
                                            Proficiency Score: {g.score}/100
                                        </div>
                                        <div className={isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}>
                                            Accuracy: {Math.round(g.accuracy)}%
                                        </div>
                                        <div className={isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}>
                                            Questions Attempted: {g.attempts}
                                        </div>
                                        <div className={`font-medium ${trendColor}`}>
                                            Trend: {trendText}
                                        </div>
                                    </div>

                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div
                                            className={`absolute inset-0 ${isDark
                                                    ? "bg-black/15"
                                                    : "bg-white/20"
                                                }`}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
