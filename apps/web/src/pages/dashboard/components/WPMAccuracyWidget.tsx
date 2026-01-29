import React from "react";
import { motion } from "framer-motion";
import { MdSpeed, MdGpsFixed } from "react-icons/md";
import {
    Area,
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

    // Get latest values for display
    const latestWpm = series.length > 0 ? series[series.length - 1].wpm : 0;
    const latestAccuracy = series.length > 0 ? series[series.length - 1].accuracy : 0;

    // Generate insight text based on trends
    const insightText = React.useMemo(() => {
        if (series.length < 2) return "Track your reading speed and accuracy over time.";

        const firstWpm = series[0].wpm;
        const lastWpm = series[series.length - 1].wpm;
        const firstAcc = series[0].accuracy;
        const lastAcc = series[series.length - 1].accuracy;

        const wpmChange = lastWpm - firstWpm;
        const accChange = lastAcc - firstAcc;

        if (wpmChange > 20 && accChange >= 0) {
            return "Excellent! Your speed is improving without sacrificing accuracy.";
        }
        if (wpmChange > 0 && accChange < -5) {
            return "Speed is up, but accuracy is dropping. Try slowing down slightly.";
        }
        if (accChange > 5 && wpmChange >= -10) {
            return "Great improvement in accuracy! Maintain this focus.";
        }
        if (wpmChange < -10 && accChange < -5) {
            return "Both metrics declining. Consider more focused practice sessions.";
        }
        return "Track your reading speed and accuracy trends over time.";
    }, [series]);

    // Chart colors
    const chartColors = React.useMemo(() => ({
        gridStroke: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        textFill: isDark ? '#A7F3D0' : '#78716C',
        wpmStroke: isDark ? '#10B981' : '#059669',
        wpmFill: isDark ? '#10B981' : '#059669',
        accuracyStroke: isDark ? '#60A5FA' : '#3B82F6',
        accuracyFill: isDark ? '#60A5FA' : '#3B82F6',
        tooltipBg: isDark ? '#1c1c21' : '#FFFFFF',
        tooltipBorder: isDark ? '#292524' : '#E7E5E4',
        tooltipText: isDark ? '#f5f6f7' : '#1C1917',
    }), [isDark]);

    const tooltipStyle = React.useMemo(() => ({
        backgroundColor: chartColors.tooltipBg,
        border: `1px solid ${chartColors.tooltipBorder}`,
        borderRadius: 12,
        color: chartColors.tooltipText,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    }), [chartColors]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className={`rounded-2xl overflow-hidden ${isDark
                ? "bg-bg-secondary-dark/40"
                : "bg-white/40"
                } backdrop-blur-sm ${className}`}
        >
            <div className="p-5 sm:p-6">
                {/* Header with current values */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-5">
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-xl sm:text-2xl ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}>
                            Speed vs Accuracy
                        </h3>
                        <p className={`text-sm mt-1.5 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}>
                            {insightText}
                        </p>
                    </div>

                    {/* Current values badges */}
                    {series.length > 0 && (
                        <div className="flex gap-2 sm:gap-3 shrink-0">
                            <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-800"
                                }`}>
                                <MdSpeed size={14} />
                                <span>{latestWpm} WPM</span>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-100 text-blue-800"
                                }`}>
                                <MdGpsFixed size={14} />
                                <span>{latestAccuracy}%</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chart */}
                <div>
                    {error ? (
                        <div className={`text-sm ${isDark ? "text-rose-300" : "text-rose-700"}`}>
                            Error loading speed/accuracy data.
                        </div>
                    ) : isLoading ? (
                        <div className="space-y-3">
                            <div className="animate-pulse h-48 rounded-xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                        </div>
                    ) : series.length === 0 ? (
                        <div className={`text-sm py-12 text-center ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                            }`}>
                            No recent data yet. Complete a few practice sessions to see your trends.
                        </div>
                    ) : (
                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    {/* Gradient definitions */}
                                    <defs>
                                        <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={chartColors.wpmFill} stopOpacity={0.3} />
                                            <stop offset="100%" stopColor={chartColors.wpmFill} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={chartColors.accuracyFill} stopOpacity={0.3} />
                                            <stop offset="100%" stopColor={chartColors.accuracyFill} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        stroke={chartColors.gridStroke}
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="label"
                                        tick={{
                                            fill: chartColors.textFill,
                                            fontSize: 11,
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={8}
                                    />

                                    <YAxis
                                        yAxisId="left"
                                        tick={{
                                            fill: chartColors.textFill,
                                            fontSize: 10,
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={40}
                                        domain={[0, "auto"]}
                                    />

                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tick={{
                                            fill: chartColors.textFill,
                                            fontSize: 10,
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={40}
                                        domain={[0, 100]}
                                    />

                                    <Tooltip
                                        contentStyle={tooltipStyle}
                                        labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                                        cursor={{ stroke: chartColors.gridStroke, strokeWidth: 1 }}
                                    />

                                    {/* WPM Area + Line */}
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="wpm"
                                        stroke="none"
                                        fill="url(#wpmGradient)"
                                        tooltipType="none"
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="wpm"
                                        name="WPM"
                                        stroke={chartColors.wpmStroke}
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 5, strokeWidth: 2, fill: chartColors.tooltipBg }}
                                    />

                                    {/* Accuracy Area + Line */}
                                    <Area
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="accuracy"
                                        stroke="none"
                                        fill="url(#accuracyGradient)"
                                        tooltipType="none"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="accuracy"
                                        name="Accuracy %"
                                        stroke={chartColors.accuracyStroke}
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 5, strokeWidth: 2, fill: chartColors.tooltipBg }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Legend */}
                    {series.length > 0 && (
                        <div className={`mt-4 pt-3 border-t flex items-center justify-center gap-6 text-xs ${isDark ? "border-border-dark text-text-muted-dark" : "border-border-light text-text-muted-light"
                            }`}>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: chartColors.wpmStroke }} />
                                <span>Reading Speed (WPM)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: chartColors.accuracyStroke }} />
                                <span>Accuracy (%)</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
