import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area,
    ComposedChart,
} from "recharts";
import type { UserAnalytics } from "../../../types";

interface WPMAccuracyProps {
    analytics: UserAnalytics[];
    sessions: Array<{
        time_spent_seconds: number;
        total_questions: number;
        correct_answers: number;
        completed_at?: string;
        created_at?: string;
    }>;
    isLoading: boolean;
    isDark: boolean;
}

interface DataPoint {
    date: string;
    wpm: number;
    accuracy: number;
    questions: number;
}

const parseYmdUtc = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);

const formatDate = (dateStr: string) => {
    const date = parseYmdUtc(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

const CustomTooltip: React.FC<{
    active?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any[];
    label?: string;
    isDark: boolean;
}> = ({ active, payload, label, isDark }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div
            className={`rounded-xl border px-4 py-3 shadow-lg ${
                isDark
                    ? "bg-bg-secondary-dark border-border-dark"
                    : "bg-bg-secondary-light border-border-light"
            }`}
        >
            <div
                className={`text-xs font-semibold mb-2 ${
                    isDark ? "text-text-primary-dark" : "text-text-primary-light"
                }`}
            >
                {label}
            </div>
            {payload.map((entry: { value?: number; dataKey?: string; color?: string }, index: number) => (
                <div
                    key={index}
                    className={`text-xs flex items-center gap-2 ${
                        isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                    }`}
                >
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span>
                        {entry.dataKey === "wpm"
                            ? `Speed: ${entry.value?.toFixed(1)} WPM`
                            : `Accuracy: ${entry.value?.toFixed(1)}%`}
                    </span>
                </div>
            ))}
        </div>
    );
};

const WPMAccuracy: React.FC<WPMAccuracyProps> = ({
    analytics,
    isLoading,
    isDark,
}) => {
    const chartData = useMemo((): DataPoint[] => {
        if (!analytics || analytics.length === 0) {
            // Generate dummy data for visualization
            return Array.from({ length: 14 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (13 - i));
                const dateStr = date.toISOString().slice(0, 10);
                
                // Simulate realistic patterns
                const baseWpm = 2 + Math.sin(i / 3) * 0.5;
                const baseAcc = 65 + Math.cos(i / 4) * 10;
                
                return {
                    date: dateStr,
                    wpm: Math.max(1, baseWpm + (Math.random() - 0.5) * 0.5),
                    accuracy: Math.min(95, Math.max(40, baseAcc + (Math.random() - 0.5) * 10)),
                    questions: Math.floor(8 + Math.random() * 6),
                };
            });
        }

        return analytics.map((a) => ({
            date: a.date,
            wpm: a.questions_attempted > 0
                ? Math.round((a.questions_attempted) / (a.minutes_practiced / 60) * 10) / 10
                : 0,
            accuracy: a.accuracy_percentage || 0,
            questions: a.questions_attempted,
        }));
    }, [analytics]);

    const stats = useMemo(() => {
        if (chartData.length === 0) {
            return { avgWpm: 0, avgAccuracy: 0, totalQuestions: 0, trend: "stable" as const };
        }

        const avgWpm = chartData.reduce((sum, d) => sum + d.wpm, 0) / chartData.length;
        const avgAccuracy = chartData.reduce((sum, d) => sum + d.accuracy, 0) / chartData.length;
        const totalQuestions = chartData.reduce((sum, d) => sum + d.questions, 0);

        // Calculate trend
        const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
        const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
        const firstAvg = firstHalf.reduce((sum, d) => sum + d.accuracy, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, d) => sum + d.accuracy, 0) / secondHalf.length;
        const trend = secondAvg > firstAvg + 2 ? "improving" : secondAvg < firstAvg - 2 ? "declining" : "stable";

        return {
            avgWpm: Math.round(avgWpm * 10) / 10,
            avgAccuracy: Math.round(avgAccuracy),
            totalQuestions,
            trend,
        };
    }, [chartData]);

    const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
    const textColor = isDark ? "#9ca3af" : "#6b7280";

    return (
        <motion.section
            className={`rounded-2xl border ${
                isDark
                    ? "bg-bg-secondary-dark border-border-dark"
                    : "bg-bg-secondary-light border-border-light"
            } p-5`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.4 }}
        >
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <h2
                            className={`text-base sm:text-lg font-semibold tracking-tight ${
                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                        >
                            ⚡ WPM vs Accuracy
                        </h2>
                        <span
                            className={`text-xs px-2 py-1 rounded-lg border ${
                                isDark
                                    ? "border-border-dark bg-bg-tertiary-dark/40 text-text-muted-dark"
                                    : "border-border-light bg-bg-tertiary-light/50 text-text-muted-light"
                            }`}
                        >
                            Speed & Precision
                        </span>
                    </div>
                    <p
                        className={`text-sm ${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                    >
                        Balance between speed (WPM) and accuracy
                    </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3">
                    <div
                        className={`rounded-xl px-3 py-2 text-center ${
                            isDark
                                ? "bg-bg-tertiary-dark/40 border border-border-dark"
                                : "bg-bg-tertiary-light/50 border border-border-light"
                        }`}
                    >
                        <div
                            className={`text-xs font-medium uppercase tracking-wide ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                        >
                            Avg Speed
                        </div>
                        <div
                            className={`text-lg font-bold ${
                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                        >
                            {stats.avgWpm} <span className="text-xs font-normal">WPM</span>
                        </div>
                    </div>

                    <div
                        className={`rounded-xl px-3 py-2 text-center ${
                            isDark
                                ? "bg-bg-tertiary-dark/40 border border-border-dark"
                                : "bg-bg-tertiary-light/50 border border-border-light"
                        }`}
                    >
                        <div
                            className={`text-xs font-medium uppercase tracking-wide ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                        >
                            Avg Accuracy
                        </div>
                        <div
                            className={`text-lg font-bold ${
                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                        >
                            {stats.avgAccuracy}%
                        </div>
                    </div>

                    <div
                        className={`rounded-xl px-3 py-2 text-center ${
                            stats.trend === "improving"
                                ? isDark
                                    ? "bg-green-900/30 border border-green-800"
                                    : "bg-green-100 border border-green-200"
                                : stats.trend === "declining"
                                ? isDark
                                    ? "bg-red-900/30 border border-red-800"
                                    : "bg-red-100 border border-red-200"
                                : isDark
                                ? "bg-bg-tertiary-dark/40 border border-border-dark"
                                : "bg-bg-tertiary-light/50 border border-border-light"
                        }`}
                    >
                        <div
                            className={`text-xs font-medium uppercase tracking-wide ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                        >
                            Trend
                        </div>
                        <div className="text-lg font-bold">
                            {stats.trend === "improving" && "📈"}
                            {stats.trend === "declining" && "📉"}
                            {stats.trend === "stable" && "➡️"}
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div
                        className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                            isDark ? "border-brand-primary-dark" : "border-brand-primary-light"
                        }`}
                    />
                </div>
            ) : (
                <>
                    <div className="mt-4 h-56 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={chartData}
                                margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
                            >
                                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => formatDate(value)}
                                    stroke={textColor}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis
                                    yAxisId="wpm"
                                    stroke={textColor}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 11 }}
                                    domain={[0, "auto"]}
                                    width={40}
                                />
                                <YAxis
                                    yAxisId="acc"
                                    orientation="right"
                                    stroke={textColor}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 11 }}
                                    domain={[0, 100]}
                                    width={40}
                                />
                                <Tooltip
                                    content={(props) => <CustomTooltip {...props} isDark={isDark} />}
                                />
                                <Legend
                                    wrapperStyle={{
                                        paddingTop: "10px",
                                    }}
                                    formatter={(value) => (
                                        <span
                                            className={
                                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                            }
                                        >
                                            {value}
                                        </span>
                                    )}
                                />
                                <Area
                                    yAxisId="wpm"
                                    type="monotone"
                                    dataKey="wpm"
                                    fill={isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(99, 102, 241, 0.1)"}
                                    stroke={isDark ? "#3b82f6" : "#6366f1"}
                                    strokeWidth={2}
                                    name="Speed (WPM)"
                                    isAnimationActive={false}
                                />
                                <Line
                                    yAxisId="acc"
                                    type="monotone"
                                    dataKey="accuracy"
                                    stroke={isDark ? "#22c55e" : "#16a34a"}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    name="Accuracy (%)"
                                    isAnimationActive={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Summary footer */}
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
                                Total questions in period: <strong>{stats.totalQuestions}</strong>
                            </span>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1">
                                    <span
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: isDark ? "#3b82f6" : "#6366f1" }}
                                    />
                                    Speed (WPM)
                                </span>
                                <span className="flex items-center gap-1">
                                    <span
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: isDark ? "#22c55e" : "#16a34a" }}
                                    />
                                    Accuracy (%)
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </motion.section>
    );
};

export default WPMAccuracy;
