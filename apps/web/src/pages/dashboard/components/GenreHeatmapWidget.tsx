import React from "react";
import { motion } from "framer-motion";
import { MdGridOn, MdTrendingUp, MdTrendingDown, MdTrendingFlat } from "react-icons/md";
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

// Get liquid fill color based on score - STRONGER LIGHT MODE COLORS
function getLiquidColor(score: number, isDark: boolean): string {
    if (score >= 80) return isDark ? "#34D399" : "#059669"; // Emerald
    if (score >= 60) return isDark ? "#6EE7B7" : "#10B981"; // Emerald lighter
    if (score >= 40) return isDark ? "#FBBF24" : "#D97706"; // Amber
    return isDark ? "#F87171" : "#DC2626"; // Red
}

// Get formatted genre name
function formatGenreName(genre: string): string {
    return genre.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Single liquid fill cell for a genre
function LiquidCell({
    genre,
    score,
    accuracy,
    attempts,
    trend,
    isDark,
}: {
    genre: string;
    score: number;
    accuracy: number;
    attempts: number;
    trend: "improving" | "declining" | "stagnant";
    isDark: boolean;
}) {
    // Determine fill color based on score (lighter/stronger for light mode)
    const liquidColor = getLiquidColor(score, isDark);

    // Calculate fill height (clamped 0-100)
    const fillHeight = Math.min(Math.max(score, 5), 100);

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { type: "spring" as const, stiffness: 220, damping: 18 }
        }
    };

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -2 }}
            className={`liquid-cell group relative h-28 border cursor-default ${isDark
                ? "bg-bg-tertiary-dark border-border-dark hover:border-brand-primary-dark/40"
                : "bg-bg-tertiary-light border-border-light hover:border-brand-primary-light/40"
                }`}
        >
            {/* Liquid fill */}
            <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${fillHeight}%` }}
                transition={{ delay: 0.3, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                className="liquid-fill"
                style={{ backgroundColor: liquidColor, opacity: isDark ? 0.35 : 0.35 }}
            >
                {/* Animated wave on top */}
                <div
                    className="liquid-wave"
                    style={{ backgroundColor: liquidColor, opacity: isDark ? 0.6 : 0.6 }}
                />
            </motion.div>

            {/* Content overlay */}
            <div className="relative z-10 h-full flex flex-col justify-between p-3">
                {/* Genre name + trend */}
                <div className="flex items-start justify-between">
                    <span className={`text-sm font-semibold leading-tight ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}>
                        {formatGenreName(genre)}
                    </span>
                    {trend === "improving" && <MdTrendingUp className="w-4 h-4 trend-improving shrink-0 trend-glow" />}
                    {trend === "declining" && <MdTrendingDown className="w-4 h-4 trend-declining shrink-0" />}
                    {trend === "stagnant" && <MdTrendingFlat className="w-4 h-4 trend-stable shrink-0" />}
                </div>

                {/* Score at bottom */}
                <div>
                    <div className={`text-2xl font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}>
                        {Math.round(score)}
                        <span className={`text-xs font-normal ml-0.5 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}>%</span>
                    </div>

                    <div className="flex items-center gap-1">
                        {trend === "improving" && (
                            <MdTrendingUp className="w-4 h-4 trend-improving" />
                        )}
                        {trend === "declining" && (
                            <MdTrendingDown className="w-4 h-4 trend-declining" />
                        )}
                        {trend === "stagnant" && (
                            <MdTrendingFlat className="w-4 h-4 trend-stable" />
                        )}
                    </div>
                </div>
            </div>

            {/* Hover tooltip */}
            <div className={`absolute inset-0 z-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl ${isDark ? "bg-bg-primary-dark/90" : "bg-white/90"
                }`}>
                <div className="text-center px-2">
                    <div className={`text-lg font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                        {Math.round(accuracy)}% accuracy
                    </div>
                    <div className={`text-xs ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
                        {attempts} question{attempts !== 1 ? 's' : ''} attempted
                    </div>
                </div>
            </div>
        </motion.div>
    );
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

    // Generate insight text based on data
    const insightText = React.useMemo(() => {
        if (heatData.length === 0) return null;

        const strongest = heatData[0];
        const weakest = heatData[heatData.length - 1];

        if (strongest && weakest && heatData.length > 1) {
            const diff = strongest.score - weakest.score;
            if (diff > 30) {
                return `Strong in ${formatGenreName(strongest.genre)}, but ${formatGenreName(weakest.genre)} needs more practice.`;
            }
            return `Your performance across genres is ${diff < 15 ? 'consistent' : 'varied'}. Hover over cells for details.`;
        }
        return "Hover over cells to see accuracy and attempt counts.";
    }, [heatData]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className={`card-depth rounded-2xl sm:rounded-3xl border overflow-hidden transition-all duration-300 ${isDark
                ? "bg-bg-secondary-dark border-border-dark"
                : "bg-bg-secondary-light border-border-light"
                } ${className}`}
        >
            {/* Gradient Header Accent - Teal theme */}
            <div className={`h-1.5 sm:h-2 w-full ${isDark
                ? 'bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500'
                : 'bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400'
                }`} />

            <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`
                            p-2.5 sm:p-3 rounded-xl sm:rounded-2xl
                            ${isDark
                                ? 'bg-teal-500/20'
                                : 'bg-teal-100'
                            }
                        `}>
                            <MdGridOn className={`text-xl sm:text-2xl ${isDark ? "text-teal-400" : "text-teal-600"
                                }`} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg sm:text-xl ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}>
                                Genre Performance
                            </h3>
                            <p className={`text-xs sm:text-sm mt-0.5 line-clamp-2 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                }`}>
                                {insightText || "Complete RC sets to see genre breakdown."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div>
                    {error ? (
                        <div className={`text-sm ${isDark ? "text-rose-300" : "text-rose-700"}`}>
                            Error loading genre performance.
                        </div>
                    ) : isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="animate-pulse h-28 rounded-2xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark"
                                />
                            ))}
                        </div>
                    ) : heatData.length === 0 ? (
                        <div className={`text-sm py-8 text-center ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                            }`}>
                            No genre data yet. Attempt a few RC sets to unlock this view.
                        </div>
                    ) : (
                        <>
                            {/* Liquid cells grid */}
                            <motion.div
                                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.08 }
                                    }
                                }}
                                initial="hidden"
                                animate="visible"
                            >
                                {heatData.slice(0, 12).map((g) => (
                                    <LiquidCell
                                        key={g.genre}
                                        genre={g.genre}
                                        score={g.score}
                                        accuracy={g.accuracy}
                                        attempts={g.attempts}
                                        trend={g.trend}
                                        isDark={isDark}
                                    />
                                ))}
                            </motion.div>

                            {/* Legend */}
                            <div className="mt-5 pt-4 border-t flex flex-wrap gap-2 text-xs">
                                <span className={`mr-2 flex items-center ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
                                    Fill = proficiency
                                </span>
                                <span className={`
                                    flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium border
                                    ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}
                                `}>
                                    <MdTrendingUp className="w-3.5 h-3.5 trend-glow" /> Improving
                                </span>
                                <span className={`
                                    flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium border
                                    ${isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'}
                                `}>
                                    <MdTrendingDown className="w-3.5 h-3.5" /> Declining
                                </span>
                                <span className={`
                                    flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium border
                                    ${isDark ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-slate-50 text-slate-700 border-slate-200'}
                                `}>
                                    <MdTrendingFlat className="w-3.5 h-3.5" /> Stable
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
