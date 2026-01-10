import React from "react";
import { motion } from "framer-motion";
import {
    MdErrorOutline,
    MdTrendingDown,
    MdTrendingFlat,
    MdTrendingUp,
} from "react-icons/md";
import type { UserMetricProficiency } from "../../../types";
import { trendToColor } from "../utils/chartHelpers";

interface LogicGapWidgetProps {
    metricProficiency: UserMetricProficiency[] | undefined;
    isLoading: boolean;
    isDark: boolean;
    index: number;
    className?: string;
    error?: unknown;
}

function TrendIcon({
    trend,
    isDark,
}: {
    trend: "improving" | "declining" | "stagnant" | null | undefined;
    isDark: boolean;
}) {
    const t = trend ?? "stagnant";
    const color = trendToColor(t, isDark);
    if (t === "improving") return <MdTrendingUp style={{ color }} />;
    if (t === "declining") return <MdTrendingDown style={{ color }} />;
    return <MdTrendingFlat style={{ color }} />;
}

function scoreToBarColor(score: number, isDark: boolean) {
    if (score < 45) return isDark ? "bg-rose-500" : "bg-rose-600";
    if (score < 60) return isDark ? "bg-amber-400" : "bg-amber-500";
    return isDark ? "bg-emerald-400" : "bg-emerald-600";
}

export const LogicGapWidget: React.FC<LogicGapWidgetProps> = ({
    metricProficiency,
    isLoading,
    isDark,
    index,
    className = "",
    error,
}) => {
    const { rows, sourceLabel } = React.useMemo(() => {
        const all = metricProficiency ?? [];
        const errorPatterns = all.filter((m) => m.dimension_type === "error_pattern");
        const reasoningSteps = all.filter((m) => m.dimension_type === "reasoning_step");

        const useErrorPatterns = errorPatterns.length > 0;
        const selected = useErrorPatterns ? errorPatterns : reasoningSteps;

        return {
            rows: selected
                .slice()
                .sort((a, b) => a.proficiency_score - b.proficiency_score)
                .slice(0, 5),
            sourceLabel: useErrorPatterns ? "Error patterns" : "Reasoning steps",
        };
    }, [metricProficiency]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className={`rounded-2xl border p-6 overflow-hidden transition-colors ${
                isDark
                    ? "bg-bg-secondary-dark border-border-dark hover:border-zinc-700"
                    : "bg-bg-secondary-light border-border-light hover:border-zinc-300"
            } ${className}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3
                        className={`font-serif font-bold text-xl flex items-center gap-2 ${
                            isDark
                                ? "text-text-primary-dark"
                                : "text-text-primary-light"
                        }`}
                    >
                        <MdErrorOutline
                            className={
                                isDark
                                    ? "text-brand-primary-dark"
                                    : "text-brand-primary-light"
                            }
                        />
                        Logic Gaps
                    </h3>
                    <p
                        className={`text-sm mt-1 ${
                            isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                        }`}
                    >
                        Common error patterns and reasoning weaknesses.
                    </p>
                </div>

                <div
                    className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                        isDark
                            ? "bg-bg-tertiary-dark border-border-dark text-text-secondary-dark"
                            : "bg-bg-tertiary-light border-border-light text-text-secondary-light"
                    }`}
                >
                    {sourceLabel}
                </div>
            </div>

            <div className="mt-6">
                {error ? (
                    <div
                        className={`text-sm ${
                            isDark ? "text-rose-300" : "text-rose-700"
                        }`}
                    >
                        Error loading logic gaps.
                    </div>
                ) : isLoading ? (
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="animate-pulse h-4 w-40 rounded bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                                <div className="animate-pulse h-2 w-full rounded bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                            </div>
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <div
                        className={`text-sm ${
                            isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                        }`}
                    >
                        No reasoning-step signals yet. Practice more questions to see
                        patterns.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rows.map((row) => (
                            <div key={row.id} className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <div
                                        className={`text-sm font-semibold truncate ${
                                            isDark
                                                ? "text-text-primary-dark"
                                                : "text-text-primary-light"
                                        }`}
                                    >
                                        {row.dimension_key}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendIcon trend={row.trend} isDark={isDark} />
                                        <span
                                            className={`text-xs font-semibold ${
                                                isDark
                                                    ? "text-text-secondary-dark"
                                                    : "text-text-secondary-light"
                                            }`}
                                        >
                                            {row.proficiency_score}/100
                                        </span>
                                    </div>
                                </div>

                                <div
                                    className={`h-2 rounded-full overflow-hidden ${
                                        isDark
                                            ? "bg-bg-tertiary-dark"
                                            : "bg-bg-tertiary-light"
                                    }`}
                                >
                                    <div
                                        className={`h-full ${scoreToBarColor(
                                            row.proficiency_score,
                                            isDark
                                        )}`}
                                        style={{ width: `${row.proficiency_score}%` }}
                                    />
                                </div>

                                <div
                                    className={`text-xs ${
                                        isDark
                                            ? "text-text-muted-dark"
                                            : "text-text-muted-light"
                                    }`}
                                >
                                    {row.total_attempts} attempts
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
