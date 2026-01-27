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
import type { UserMetricProficiency } from "../../../types";
import { extractSpeedVsAccuracyData, clamp } from "../utils/chartHelpers";

interface WPMAccuracyWidgetProps {
    metrics: UserMetricProficiency[] | undefined;
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
    metrics,
    isLoading,
    isDark,
    index,
    className = "",
    error,
}) => {
    const series = React.useMemo(() => {
        const raw = extractSpeedVsAccuracyData(metrics ?? []);
        return raw.map((d) => ({
            ...d,
            wpm: Math.round(d.wpm),
            accuracy: clamp(Math.round(d.accuracy), 0, 100),
            label: formatDateShort(d.date),
        }));
    }, [metrics]);

    // Get colors from CSS variables
    const getChartColors = React.useCallback(() => {
        if (typeof window === 'undefined') return {
            gridStroke: isDark ? '#292524' : '#E7E5E4',
            textFill: isDark ? '#A7F3D0' : '#57534E',
            wpmStroke: isDark ? '#10B981' : '#0F5F53',
            accuracyStroke: isDark ? '#34D399' : '#14B8A6',
            tooltipBg: isDark ? '#131C18' : '#FFFFFF',
            tooltipBorder: isDark ? '#292524' : '#E7E5E4',
            tooltipText: isDark ? '#ECFDF5' : '#1C1917',
        };

        return {
            gridStroke: isDark ? '#292524' : '#E7E5E4',
            textFill: isDark ? '#A7F3D0' : '#57534E',
            wpmStroke: isDark ? '#10B981' : '#0F5F53',
            accuracyStroke: isDark ? '#34D399' : '#14B8A6',
            tooltipBg: isDark ? '#131C18' : '#FFFFFF',
            tooltipBorder: isDark ? '#292524' : '#E7E5E4',
            tooltipText: isDark ? '#ECFDF5' : '#1C1917',
        };
    }, [isDark]);

    const chartColors = getChartColors();

    const tooltipStyle = React.useMemo(() => {
        return {
            backgroundColor: chartColors.tooltipBg,
            border: `1px solid ${chartColors.tooltipBorder}`,
            borderRadius: 12,
            color: chartColors.tooltipText,
        };
    }, [chartColors]);

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
                        className={`text-sm mt-1 ${isDark
                            ? "text-text-secondary-dark"
                            : "text-text-secondary-light"
                            }`}
                    >
                        Speed–accuracy tradeoff over the last 60 sessions.
                    </p>
                </div>
            </div>

            <div className="mt-6">
                {error ? (
                    <div
                        className={`text-sm ${isDark ? "text-rose-300" : "text-rose-700"
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
                        className={`text-sm ${isDark
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
                                    stroke={chartColors.gridStroke}
                                    strokeDasharray="3 3"
                                />
                                <XAxis
                                    dataKey="label"
                                    tick={{
                                        fill: chartColors.textFill,
                                        fontSize: 11,
                                    }}
                                />
                                <YAxis
                                    yAxisId="left"
                                    tick={{
                                        fill: chartColors.textFill,
                                        fontSize: 10,
                                    }}
                                    width={36}
                                    domain={[0, "auto"]}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{
                                        fill: chartColors.textFill,
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
                                    stroke={chartColors.wpmStroke}
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />

                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="accuracy"
                                    name="Accuracy %"
                                    stroke={chartColors.accuracyStroke}
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
