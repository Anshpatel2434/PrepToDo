import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { UserMetricProficiency } from "../../../types";

interface LogicGapPanelProps {
    errorPatterns: UserMetricProficiency[];
    isLoading: boolean;
    isDark: boolean;
}

interface ErrorPatternItem {
    pattern: string;
    frequency: number;
    severity: "high" | "medium" | "low";
    trend: "improving" | "declining" | "stagnant" | null;
}

const errorPatternLabels: Record<string, string> = {
    "overgeneralization": "Overgeneralization",
    "extreme_option_bias": "Extreme Options",
    "timing_mistakes": "Timing Issues",
    "misread_question": "Misread Question",
    "context_misinterpretation": "Context Misinterpretation",
    "assumption_making": "False Assumptions",
    "distractor_trap": "Distractor Traps",
    "time_wastage": "Time Wastage",
    "last_minute_change": "Last-minute Change",
    "vocab_gap": "Vocabulary Gap",
    "inference_leap": "Inference Leap",
    "tone_misread": "Tone Misread",
};

const getErrorLabel = (key: string) => errorPatternLabels[key] || key.replace(/_/g, " ");

const getSeverityColor = (severity: string, _isDark: boolean): string => {
    switch (severity) {
        case "high":
            return _isDark ? "bg-red-900/50 border-red-700" : "bg-red-100 border-red-300";
        case "medium":
            return _isDark ? "bg-yellow-900/50 border-yellow-700" : "bg-yellow-100 border-yellow-300";
        case "low":
            return _isDark ? "bg-green-900/50 border-green-700" : "bg-green-100 border-green-300";
        default:
            return _isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300";
    }
};

const getSeverityBadgeColor = (severity: string, _isDark: boolean): string => {
    switch (severity) {
        case "high":
            return "bg-red-500 text-white";
        case "medium":
            return "bg-yellow-500 text-black";
        case "low":
            return "bg-green-500 text-white";
        default:
            return "bg-gray-500 text-white";
    }
};

const getTrendIndicator = (trend: string | null): { icon: string; label: string } => {
    switch (trend) {
        case "improving":
            return { icon: "↓", label: "Improving" };
        case "declining":
            return { icon: "↑", label: "Getting Worse" };
        case "stagnant":
            return { icon: "→", label: "No Change" };
        default:
            return { icon: "?", label: "Unknown" };
    }
};

const LogicGapPanel: React.FC<LogicGapPanelProps> = ({
    errorPatterns,
    isLoading,
    isDark,
}) => {
    const processedData = useMemo((): ErrorPatternItem[] => {
        if (!errorPatterns || errorPatterns.length === 0) {
            // Generate dummy data for display
            return [
                { pattern: "distractor_trap", frequency: 8, severity: "high" as const, trend: "declining" as const },
                { pattern: "overgeneralization", frequency: 6, severity: "high" as const, trend: "stagnant" as const },
                { pattern: "misread_question", frequency: 5, severity: "medium" as const, trend: "improving" as const },
                { pattern: "last_minute_change", frequency: 4, severity: "medium" as const, trend: "stagnant" as const },
                { pattern: "inference_leap", frequency: 3, severity: "low" as const, trend: "improving" as const },
                { pattern: "time_wastage", frequency: 2, severity: "low" as const, trend: "improving" as const },
            ];
        }

        return errorPatterns.map((e) => ({
            pattern: e.dimension_key,
            frequency: e.total_attempts - e.correct_attempts, // Approximate error count
            severity: e.proficiency_score < 40 ? "high" as const : e.proficiency_score < 60 ? "medium" as const : "low" as const,
            trend: e.trend ?? null,
        }));
    }, [errorPatterns]);

    const highPriorityCount = useMemo(() => 
        processedData.filter((d) => d.severity === "high").length, 
    [processedData]);

    const sortedByFrequency = useMemo(() => 
        [...processedData].sort((a, b) => b.frequency - a.frequency), 
    [processedData]);

    return (
        <motion.section
            className={`rounded-2xl border ${
                isDark
                    ? "bg-bg-secondary-dark border-border-dark"
                    : "bg-bg-secondary-light border-border-light"
            } p-5`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.35 }}
        >
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <h2
                            className={`text-base sm:text-lg font-semibold tracking-tight ${
                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                        >
                            🔍 Logic Gap Panel
                        </h2>
                    </div>
                    <p
                        className={`text-sm ${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                    >
                        Error patterns and reasoning gaps to address
                    </p>
                </div>

                {/* Priority indicator */}
                <div
                    className={`rounded-xl px-3 py-2 flex items-center gap-2 ${
                        highPriorityCount > 0
                            ? isDark
                                ? "bg-red-900/30 border border-red-800"
                                : "bg-red-100 border border-red-200"
                            : isDark
                                ? "bg-green-900/30 border border-green-800"
                                : "bg-green-100 border border-green-200"
                    }`}
                >
                    <span
                        className={`text-lg ${
                            highPriorityCount > 0
                                ? "text-red-500"
                                : "text-green-500"
                        }`}
                    >
                        {highPriorityCount > 0 ? "⚠️" : "✅"}
                    </span>
                    <div>
                        <div
                            className={`text-xs font-medium ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                        >
                            Priority Items
                        </div>
                        <div
                            className={`text-sm font-bold ${
                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                        >
                            {highPriorityCount} to fix
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-48">
                    <div
                        className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                            isDark ? "border-brand-primary-dark" : "border-brand-primary-light"
                        }`}
                    />
                </div>
            ) : (
                <>
                    {/* Error pattern cards */}
                    <div className="space-y-3">
                        {sortedByFrequency.map((error, index) => {
                            const trend = getTrendIndicator(error.trend);
                            return (
                                <motion.div
                                    key={error.pattern}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`rounded-xl border p-4 ${getSeverityColor(error.severity, isDark)}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className={`text-sm font-semibold ${
                                                        isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                                    }`}
                                                >
                                                    {getErrorLabel(error.pattern)}
                                                </span>
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase ${getSeverityBadgeColor(error.severity, isDark)}`}
                                                >
                                                    {error.severity}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs">
                                                <span
                                                    className={
                                                        isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                                    }
                                                >
                                                    Occurred {error.frequency} times
                                                </span>
                                                <span
                                                    className={`flex items-center gap-1 ${
                                                        error.trend === "improving"
                                                            ? "text-green-500"
                                                            : error.trend === "declining"
                                                            ? "text-red-500"
                                                            : "text-yellow-500"
                                                    }`}
                                                >
                                                    {trend.icon} {trend.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Improvement suggestion */}
                                        <div
                                            className={`text-xs px-2 py-1 rounded-lg ${
                                                isDark
                                                    ? "bg-bg-tertiary-dark/60 text-text-secondary-dark"
                                                    : "bg-bg-tertiary-light/60 text-text-secondary-light"
                                            }`}
                                        >
                                            {error.severity === "high" && "Review fundamentals"}
                                            {error.severity === "medium" && "Practice more examples"}
                                            {error.severity === "low" && "Keep practicing"}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Empty state */}
                    {processedData.length === 0 && (
                        <div
                            className={`flex flex-col items-center justify-center h-48 ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                        >
                            <span className="text-4xl mb-2">🎯</span>
                            <span className="text-sm text-center">
                                Complete more practice to identify error patterns
                            </span>
                        </div>
                    )}

                    {/* Footer */}
                    <div
                        className={`mt-4 pt-4 border-t ${
                            isDark ? "border-border-dark" : "border-border-light"
                        }`}
                    >
                        <div className="flex items-center justify-between text-sm">
                            <span
                                className={
                                    isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                }
                            >
                                Focus on high-priority items first
                            </span>
                            <button
                                className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                                    isDark
                                        ? "bg-brand-primary-dark/20 text-brand-primary-dark hover:bg-brand-primary-dark/30"
                                        : "bg-brand-primary-light/20 text-brand-primary-light hover:bg-brand-primary-light/30"
                                }`}
                            >
                                View Details →
                            </button>
                        </div>
                    </div>
                </>
            )}
        </motion.section>
    );
};

export default LogicGapPanel;
