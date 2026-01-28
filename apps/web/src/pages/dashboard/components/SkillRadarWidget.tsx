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

// Single bar column component with hover tooltip and liquid fill effect
function BarColumn({
    metricKey,
    label,
    score,
    trend,
    isDark,
    isHighlighted,
}: {
    metricKey: string;
    label: string;
    score: number;
    trend?: "improving" | "declining" | "stagnant" | null;
    isDark: boolean;
    isHighlighted: boolean;
}) {
    const statusColor = getStatusColor(score, isDark);
    const reasoningSteps = getReasoningSteps(metricKey);
    const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });
    const [showTooltip, setShowTooltip] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring" as const, stiffness: 300, damping: 24 }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setTooltipPosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    const handleMouseEnter = () => {
        setShowTooltip(true);
    };

    const handleMouseLeave = () => {
        setShowTooltip(false);
    };

    return (
        <motion.div
            ref={containerRef}
            variants={itemVariants}
            className="relative flex flex-col items-center flex-1"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Bar Container - Fixed width and height */}
            <div className={`relative w-full max-w-[80px] h-48 overflow-hidden rounded-t-xl border ${isDark ? "bg-bg-tertiary-dark border-border-dark" : "bg-bg-tertiary-light border-border-light"}`}>
                {/* Liquid Fill with Wave Effect - positioned absolutely at bottom */}
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(score, 100)}%` }}
                    transition={{ delay: 0.3, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                        backgroundColor: statusColor,
                        opacity: isDark ? 0.35 : 0.35
                    }}
                >
                    {/* Animated wave on top */}
                    <div
                        className="liquid-wave"
                        style={{
                            backgroundColor: statusColor,
                            opacity: isDark ? 0.6 : 0.6
                        }}
                    />
                </motion.div>

                {/* Score Display Inside Bar */}
                <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-center p-2">
                    <div className={`text-lg font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                        {Math.round(score)}
                        <span className={`text-xs font-normal ml-0.5 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>%</span>
                    </div>
                </div>
            </div>

            {/* Label and Trend */}
            <div className="mt-3 flex flex-col items-center gap-1 w-full max-w-[100px] h-16">
                <span className={`text-xs font-medium text-center leading-tight ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                    {label}
                </span>
                {/* Trend Icon */}
                <div className="flex items-center justify-center mt-auto">
                    {trend === 'improving' && <MdTrendingUp className="text-emerald-500 text-sm trend-glow" />}
                    {trend === 'declining' && <MdTrendingDown className="text-rose-500 text-sm" />}
                    {trend === 'stagnant' && <MdTrendingFlat className="text-slate-400 text-sm" />}
                </div>
            </div>

            {/* Cursor-following Tooltip with Reasoning Steps */}
            {reasoningSteps.length > 0 && showTooltip && (
                <div
                    className={`absolute z-50 p-3 rounded-xl border shadow-xl pointer-events-none min-w-[220px] max-w-[280px] ${isDark
                        ? "bg-bg-primary-dark border-border-dark"
                        : "bg-white border-border-light"
                        }`}
                    style={{
                        left: `${tooltipPosition.x + 10}px`,
                        top: `${tooltipPosition.y - 60}px`,
                    }}
                >
                    <div className={`text-xs font-semibold mb-2 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        Focus on these reasoning skills:
                    </div>
                    <ul className="space-y-1">
                        {reasoningSteps.map((step, i) => (
                            <li key={i} className={`text-xs flex items-start gap-2 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
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
            .slice(0, 7); // Show 7 bars for better visualization
    }, [coreMetrics]);

    // Find the weakest metric to highlight
    const weakestMetricKey = sortedMetrics.length > 0 ? sortedMetrics[0].dimension_key : null;

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
                            {/* Bar Graph */}
                            <motion.div
                                className="flex items-end justify-between gap-2 px-2"
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
                                    <BarColumn
                                        key={metric.id}
                                        metricKey={metric.dimension_key}
                                        label={getMetricDisplayName(metric.dimension_key)}
                                        score={metric.proficiency_score}
                                        trend={metric.trend}
                                        isDark={isDark}
                                        isHighlighted={metric.dimension_key === weakestMetricKey}
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
