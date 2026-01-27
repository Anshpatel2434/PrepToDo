import React from "react";
import { motion } from "framer-motion";
import { MdInsights, MdTrendingUp, MdTrendingDown, MdTrendingFlat } from "react-icons/md";
import type { UserMetricProficiency } from "../../../types";
import { metricMappingJson } from "../config/core_metric_reasoning_map_v1_0";

interface SkillRadarWidgetProps {
    coreMetrics: UserMetricProficiency[] | undefined;
    isLoading: boolean;
    isDark: boolean;
    index: number;
    className?: string;
    error?: unknown;
}

// Get human-readable name for a metric
function getMetricDisplayName(metricKey: string): string {
    return metricKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Get status color based on proficiency score - STRONGER FOR LIGHT MODE
function getStatusColor(score: number, isDark: boolean): string {
    if (score >= 80) return isDark ? "#34D399" : "#059669"; // Emerald 400 / 600
    if (score >= 60) return isDark ? "#6EE7B7" : "#10B981"; // Emerald 300 / 500
    if (score >= 40) return isDark ? "#FBBF24" : "#D97706"; // Amber 400 / 600
    return isDark ? "#F87171" : "#DC2626"; // Red 400 / 600
}

// Get reasoning steps for a metric in human-readable format
function getReasoningSteps(metricKey: string): string[] {
    const steps = metricMappingJson.metrics[metricKey as keyof typeof metricMappingJson.metrics];
    if (!steps || !steps.reasoning_steps || steps.reasoning_steps.length === 0) {
        return [];
    }
    return steps.reasoning_steps.slice(0, 3).map(step => step.label);
}

// Get trend icon component


// Single proficiency bar component with hover tooltip
function ProficiencyBar({
    metricKey,
    label,
    score,
    trend,
    isDark,
}: {
    metricKey: string;
    label: string;
    score: number;
    trend?: "improving" | "declining" | "stagnant" | null;
    isDark: boolean;
}) {
    const statusColor = getStatusColor(score, isDark);
    const reasoningSteps = getReasoningSteps(metricKey);

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { type: "spring" as const, stiffness: 300, damping: 24 }
        }
    };

    return (
        <motion.div
            variants={itemVariants}
            className="group relative"
        >
            <div className="flex items-center justify-between mb-1.5 gap-2">
                <span className={`text-sm font-medium truncate cursor-help ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                    }`}>
                    {label}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                    {/* Colored Status Pill */}
                    <span className={`
                        text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide border
                        ${score >= 80
                            ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200') + ' ambient-glow'
                            : score >= 60
                                ? isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200'
                                : score >= 40
                                    ? isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                                    : isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }
                    `}>
                        {score >= 80 ? 'Strong' : score >= 60 ? 'Good' : score >= 40 ? 'Building' : 'Focus'}
                    </span>

                    {/* Trend Icon */}
                    {trend === 'improving' && <MdTrendingUp className="text-emerald-500 trend-glow" />}
                    {trend === 'declining' && <MdTrendingDown className="text-rose-500" />}
                    {trend === 'stagnant' && <MdTrendingFlat className="text-slate-400" />}
                    <span className={`text-sm font-bold tabular-nums ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}>
                        {Math.round(score)}%
                    </span>
                </div>
            </div>

            {/* Proficiency Bar */}
            <div className={`proficiency-bar ${isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"}`}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(score, 100)}%` }}
                    transition={{ delay: 0.4, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                    className="proficiency-bar-fill barPulse"
                    style={{
                        backgroundColor: statusColor,
                        "--pulse-color": statusColor,
                    } as React.CSSProperties}
                >
                    {/* Pulse indicator on the edge */}
                    <div
                        className="proficiency-bar-pulse"
                        style={{
                            backgroundColor: statusColor,
                            "--pulse-color": statusColor,
                        } as React.CSSProperties}
                    />
                </motion.div>
            </div>

            {/* Hover Tooltip with Reasoning Steps */}
            {reasoningSteps.length > 0 && (
                <div className={`absolute left-0 right-0 top-full mt-2 p-3 rounded-xl border z-20
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
                    ${isDark
                        ? "bg-bg-primary-dark border-border-dark shadow-lg"
                        : "bg-white border-border-light shadow-lg"
                    }`}
                >
                    <div className={`text-xs font-semibold mb-2 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}>
                        Focus on these reasoning skills:
                    </div>
                    <ul className="space-y-1">
                        {reasoningSteps.map((step, i) => (
                            <li key={i} className={`text-xs flex items-start gap-2 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}>
                                <span className="text-brand-primary-light dark:text-brand-primary-dark">•</span>
                                {step}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </motion.div>
    );
}

export const SkillRadarWidget: React.FC<SkillRadarWidgetProps> = ({
    coreMetrics,
    isLoading,
    isDark,
    index,
    className = "",
    error,
}) => {
    // Filter out reading_speed_wpm and sort by proficiency (weakest first)
    const sortedMetrics = React.useMemo(() => {
        return (coreMetrics ?? [])
            .filter(m => m.dimension_key !== 'reading_speed_wpm')
            .sort((a, b) => a.proficiency_score - b.proficiency_score)
            .slice(0, 10);
    }, [coreMetrics]);

    // Generate insight text based on data
    const insightText = React.useMemo(() => {
        if (sortedMetrics.length === 0) return null;

        const weakest = sortedMetrics[0];
        const strongest = sortedMetrics[sortedMetrics.length - 1];

        if (weakest && strongest) {
            const weakName = getMetricDisplayName(weakest.dimension_key);
            return `Your weakest skill is ${weakName} at ${Math.round(weakest.proficiency_score)}%. Hover over any skill to see which reasoning patterns to practice.`;
        }
        return "Hover over any skill to see which reasoning patterns need your attention.";
    }, [sortedMetrics]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className={`card-depth rounded-2xl sm:rounded-3xl border overflow-hidden transition-all duration-300 ${isDark
                ? "bg-bg-secondary-dark border-border-dark"
                : "bg-bg-secondary-light border-border-light"
                } ${className}`}
        >
            {/* Gradient Header Accent */}
            <div className={`h-1.5 sm:h-2 w-full ${isDark
                ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500'
                : 'bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400'
                }`} />

            <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`
                            p-2.5 sm:p-3 rounded-xl sm:rounded-2xl
                            ${isDark
                                ? 'bg-violet-500/20'
                                : 'bg-violet-100'
                            }
                        `}>
                            <MdInsights className={`text-xl sm:text-2xl ${isDark ? "text-violet-400" : "text-violet-600"
                                }`} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg sm:text-xl ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}>
                                Skill Proficiency
                            </h3>
                            {insightText && (
                                <p className={`text-xs sm:text-sm mt-0.5 line-clamp-2 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                    }`}>
                                    {insightText}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                {/* Content */}
                <div>
                    {error ? (
                        <div className={`text-sm ${isDark ? "text-rose-300" : "text-rose-700"}`}>
                            Error loading skill data.
                        </div>
                    ) : isLoading ? (
                        <div className="space-y-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="animate-pulse h-4 w-32 rounded bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                                    <div className="animate-pulse h-2 w-full rounded-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                                </div>
                            ))}
                        </div>
                    ) : sortedMetrics.length < 3 ? (
                        <div className={`text-sm py-8 text-center ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                            }`}>
                            Not enough skill data yet. Complete more practice sessions to see your proficiency breakdown.
                        </div>
                    ) : (
                        <>
                            {/* Proficiency Bars */}
                            <motion.div
                                className="space-y-4"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: {
                                            staggerChildren: 0.1
                                        }
                                    }
                                }}
                                initial="hidden"
                                animate="visible"
                            >
                                {sortedMetrics.map((metric) => (
                                    <ProficiencyBar
                                        key={metric.id}
                                        metricKey={metric.dimension_key}
                                        label={getMetricDisplayName(metric.dimension_key)}
                                        score={metric.proficiency_score}
                                        trend={metric.trend}
                                        isDark={isDark}
                                    />
                                ))}
                            </motion.div>

                            {/* Legend */}
                            <div className={`mt-6 pt-4 border-t flex flex-wrap gap-4 text-xs ${isDark ? "border-border-dark text-text-muted-dark" : "border-border-light text-text-muted-light"
                                }`}>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: isDark ? "#34D399" : "#059669" }} />
                                    <span>80%+ Strong</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: isDark ? "#6EE7B7" : "#10B981" }} />
                                    <span>60-80% Good</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: isDark ? "#FBBF24" : "#D97706" }} />
                                    <span>40-60% Develop</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: isDark ? "#F87171" : "#DC2626" }} />
                                    <span>&lt;40% Focus</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
