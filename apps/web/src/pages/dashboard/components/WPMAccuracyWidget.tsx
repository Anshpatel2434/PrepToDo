import React from "react";
import { motion } from "framer-motion";
import { MdShowChart } from "react-icons/md";
import {
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { UserAnalytics } from "../../../types";
import { calculateWPMAccuracyData, clamp } from "../utils/chartHelpers";

interface WPMAccuracyWidgetProps {
    analytics: UserAnalytics[] | undefined;
    isLoading: boolean;
    isDark: boolean;
    index: number;
    className?: string;
    error?: unknown;
}

function formatDateShort(date: string) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;

    return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

export const WPMAccuracyWidget: React.FC<WPMAccuracyWidgetProps> = ({
    analytics,
    isLoading,
    isDark,
    index,
    className = "",
    error,
}) => {
    const series = React.useMemo(() => {
        const raw = calculateWPMAccuracyData(analytics ?? []);
        return raw.map((d) => ({
            ...d,
            wpm: Math.round(d.wpm),
            accuracy: clamp(Math.round(d.accuracy), 0, 100),
            label: formatDateShort(d.date),
        }));
    }, [analytics]);

    const tooltipStyle = React.useMemo(() => {
        return {
            backgroundColor: isDark ? "#18181b" : "#ffffff",
            border: `1px solid ${isDark ? "#3f3f46" : "#e4e4e7"}`,
            borderRadius: 12,
            color: isDark ? "#fafafa" : "#18181b",
        };
    }, [isDark]);

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
                        <MdShowChart
                            className={
                                isDark
                                    ? "text-brand-primary-dark"
                                    : "text-brand-primary-light"
                            }
                        />
                        WPM vs Accuracy
                    </h3>
                    <p
                        className={`text-sm mt-1 ${
                            isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                        }`}
                    >
                        Speed–accuracy tradeoff over the last 30 days.
                    </p>
                </div>
            </div>

            <div className="mt-6">
                {error ? (
                    <div
                        className={`text-sm ${
                            isDark ? "text-rose-300" : "text-rose-700"
                        }`}
                    >
                        Error loading speed/accuracy.
                    </div>
                ) : isLoading ? (
                    <div className="space-y-3">
                        <div className="animate-pulse h-48 rounded-xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                        <div className="animate-pulse h-4 w-2/3 rounded bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                    </div>
                ) : series.length === 0 ? (
                    <div
                        className={`text-sm ${
                            isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                        }`}
                    >
                        No recent analytics yet. Finish a few daily sessions to populate
                        this chart.
                    </div>
                ) : (
                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={series}>
                                <CartesianGrid
                                    stroke={isDark ? "#3f3f46" : "#e4e4e7"}
                                    strokeDasharray="3 3"
                                />
                                <XAxis
                                    dataKey="label"
                                    tick={{
                                        fill: isDark ? "#d4d4d8" : "#3f3f46",
                                        fontSize: 11,
                                    }}
                                />
                                <YAxis
                                    yAxisId="left"
                                    tick={{
                                        fill: isDark ? "#a1a1aa" : "#71717a",
                                        fontSize: 10,
                                    }}
                                    width={36}
                                    domain={[0, "auto"]}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{
                                        fill: isDark ? "#a1a1aa" : "#71717a",
                                        fontSize: 10,
                                    }}
                                    width={36}
                                    domain={[0, 100]}
                                />
                                <Tooltip contentStyle={tooltipStyle} />

                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="wpm"
                                    name="WPM"
                                    stroke={isDark ? "#22c55e" : "#16a34a"}
                                    strokeWidth={2}
                                    dot={false}
                                />

                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="accuracy"
                                    name="Accuracy %"
                                    stroke={isDark ? "#60a5fa" : "#2563eb"}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
