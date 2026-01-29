import React from "react";
import { motion } from "framer-motion";
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
    isDark,
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
            const parentRect = containerRef.current.closest('.rounded-2xl')?.getBoundingClientRect();

            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;

            // Adjust position to prevent tooltip from going outside the widget
            if (parentRect) {
                const tooltipWidth = 280;

                // Check if tooltip would overflow on the right
                if (e.clientX + tooltipWidth + 10 > parentRect.right) {
                    x = x - tooltipWidth - 20;
                }

                // Check if tooltip would overflow on the left
                if (e.clientX - tooltipWidth - 10 < parentRect.left) {
                    x = 10;
                }
            }

            setTooltipPosition({ x, y });
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
            {/* Bar Container - Glass test tube effect */}
            <div className={`relative w-full max-w-[80px] h-48 overflow-hidden rounded-t-2xl border-2 ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} backdrop-blur-sm shadow-inner`}>
                {/* Liquid Fill with Wave Effect - positioned absolutely at bottom */}
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(score, 100)}%` }}
                    transition={{ delay: 0.3, duration: 2, ease: [0.34, 1.56, 0.64, 1] }}
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                        backgroundColor: statusColor,
                        opacity: 0.6,
                        boxShadow: `inset 0 -2px 8px rgba(255,255,255,0.3), 0 2px 8px ${statusColor}40`
                    }}
                >
                    {/* Animated wave on top */}
                    <div
                        className="liquid-wave"
                        style={{
                            backgroundColor: statusColor,
                            opacity: 0.4
                        }}
                    />

                    {/* Glass shine effect */}
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent" style={{ width: '30%', left: '10%' }} />
                </motion.div>

                {/* Score Display Inside Bar */}
                <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-center p-1.5">
                    <div className={`text-base font-bold drop-shadow-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                        {Math.round(score)}
                        <span className={`text-[10px] font-normal ml-0.5`}>%</span>
                    </div>
                </div>

                {/* Glass reflection overlay */}
                <div className="absolute inset-0 bg-linear-to-br from-white/30 via-transparent to-transparent pointer-events-none" style={{ width: '40%' }} />
            </div>

            {/* Label and Trend */}
            <div className="mt-2 flex flex-col items-center gap-0.5 w-full max-w-[100px] h-12">
                <span className={`text-xs font-medium text-center leading-tight ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                    {label}
                </span>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className={`rounded-2xl overflow-hidden h-full ${isDark
                ? "bg-bg-secondary-dark/40"
                : "bg-white/40"
                } backdrop-blur-md ${className}`}
        >
            <div className="p-5 sm:p-6">
                {/* Header */}
                <div className="mb-5">
                    <h3 className={`font-bold text-xl sm:text-2xl ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}>
                        Skill Proficiency
                    </h3>
                    {insightText && (
                        <p className={`text-sm mt-1.5 leading-relaxed ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}>
                            {insightText}
                            <span className="block mt-1 opacity-80 italic text-xs">
                                Percentages represent reasoning mastery: your ability to consistently apply logic patterns across all attempted questions.
                            </span>
                        </p>
                    )}
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
                                className="flex items-end justify-between"
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
                            <div className={`pt-4 border-t flex flex-wrap gap-3 text-[11px] ${isDark ? "border-white/5 text-text-muted-dark" : "border-black/5 text-text-muted-light"
                                }`}>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: isDark ? "#34D399" : "#059669" }} />
                                    <span>Strong</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: isDark ? "#6EE7B7" : "#10B981" }} />
                                    <span>Good</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: isDark ? "#FBBF24" : "#D97706" }} />
                                    <span>Developing</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: isDark ? "#F87171" : "#DC2626" }} />
                                    <span>Focus</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
