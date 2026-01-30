import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
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
            className={`liquid-cell group relative h-32 cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ${isDark
                ? "bg-white/5 hover:bg-white/10"
                : "bg-black/5 hover:bg-black/10"
                } shadow-sm hover:shadow-md`}
        >
            {/* Liquid fill */}
            <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${fillHeight}%` }}
                transition={{ delay: 0.3, duration: 2, ease: [0.34, 1.56, 0.64, 1] }}
                className="liquid-fill"
                style={{
                    backgroundColor: liquidColor,
                    opacity: 0.6,
                    boxShadow: `inset 0 -2px 8px rgba(255,255,255,0.3), 0 2px 8px ${liquidColor}40`
                }}
            >
                {/* Animated wave on top */}
                <div
                    className="liquid-wave"
                    style={{ backgroundColor: liquidColor, opacity: 0.4 }}
                />

                {/* Glass shine effect */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent" style={{ width: '30%', left: '10%' }} />
            </motion.div>

            {/* Glass reflection overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-white/30 via-transparent to-transparent pointer-events-none" style={{ width: '40%' }} />

            {/* Content overlay */}
            <div className="relative z-10 h-full flex flex-col justify-between p-3">
                {/* Genre name + trend */}
                <div className="flex items-start justify-between">
                    <span className={`text-sm font-semibold leading-tight ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}>
                        {formatGenreName(genre)}
                    </span>
                </div>

                {/* Score at bottom */}
                <div>
                    <div className={`text-2xl font-bold drop-shadow-sm ${isDark ? "text-white" : "text-gray-900"
                        }`}>
                        {Math.round(score)}
                        <span className={`text-xs font-normal ml-0.5 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}>%</span>
                    </div>

                    <div className="flex items-center gap-1">
                        {trend === "improving" && (
                            <TrendingUp className="w-4 h-4 trend-improving" />
                        )}
                        {trend === "declining" && (
                            <TrendingDown className="w-4 h-4 trend-declining" />
                        )}
                        {trend === "stagnant" && (
                            <Minus className="w-4 h-4 trend-stable" />
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className={`rounded-3xl overflow-hidden ${isDark
                ? "bg-bg-secondary-dark/5"
                : "bg-white/20"
                } backdrop-blur-xl ${className}`}
        >
            <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="mb-5">
                    <h3 className={`font-bold text-2xl sm:text-3xl ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}>
                        Genre Performance
                    </h3>
                    <p className={`text-lg mt-3 opacity-80 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}>
                        {insightText || "Complete RC sets to see genre breakdown."}
                    </p>
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
                                    className="h-28 rounded-2xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark"
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
                            <div className="mt-5 pt-4 border-t flex flex-col gap-3">
                                <div className={`leading-relaxed ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
                                    <span className={`font-semibold block mb-1 uppercase tracking-wider opacity-80 text-lg ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>Understanding the metrics</span>
                                    <div className="text-md">
                                        The <span className={`font-semibold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>fill level</span> represents your holistic proficiency—a weighted score of accuracy and comprehension depth.
                                    </div>
                                    <div className="text-md">
                                        The <span className={`font-semibold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>percentage</span> indicates your mastery of specific genre nuances based on your performance history.
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 text-[11px]">
                                    <span className={`
                                        flex items-center gap-1.5 px-2 py-0.5 rounded-lg
                                        ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500/10 text-emerald-700'}
                                    `}>
                                        <TrendingUp className="w-3 h-3" /> Improving
                                    </span>
                                    <span className={`
                                        flex items-center gap-1.5 px-2 py-0.5 rounded-lg
                                        ${isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-500/10 text-rose-700'}
                                    `}>
                                        <TrendingDown className="w-3 h-3" /> Declining
                                    </span>
                                    <span className={`
                                        flex items-center gap-1.5 px-2 py-0.5 rounded-lg
                                        ${isDark ? 'bg-slate-500/10 text-slate-400' : 'bg-slate-500/10 text-slate-700'}
                                    `}>
                                        <Minus className="w-3 h-3" /> Stable
                                    </span>
                                </div>
                                            {/* Legend */}
                                            <div className={`flex flex-wrap gap-3 text-[11px] ${isDark ? "border-white/5 text-text-muted-dark" : "border-black/5 text-text-muted-light"
                                                }`}>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-3 h-3 rounded-md" style={{ backgroundColor: isDark ? "#34D399" : "#059669" }} />
                                                    <span className="text-sm">Strong</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-3 h-3 rounded-md" style={{ backgroundColor: isDark ? "#6EE7B7" : "#10B981" }} />
                                                    <span className="text-sm">Good</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-3 h-3 rounded-md" style={{ backgroundColor: isDark ? "#FBBF24" : "#D97706" }} />
                                                    <span className="text-sm">Developing</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-3 h-3 rounded-md" style={{ backgroundColor: isDark ? "#F87171" : "#DC2626" }} />
                                                    <span className="text-sm">Focus</span>
                                                </div>
                                            </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
