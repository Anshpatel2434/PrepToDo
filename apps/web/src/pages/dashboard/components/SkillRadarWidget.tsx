import React from "react";
import { motion } from "framer-motion";
import { MdInsights } from "react-icons/md";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { UserMetricProficiency } from "../../../types";
import { transformRadarData, trendToColor } from "../utils/chartHelpers";
import { coreMetricsDefinition } from "../config/user_core_metrics_definition_v1";

interface SkillRadarWidgetProps {
    coreMetrics: UserMetricProficiency[] | undefined;
    isLoading: boolean;
    isDark: boolean;
    index: number;
    className?: string;
    error?: unknown;
}

export const SkillRadarWidget: React.FC<SkillRadarWidgetProps> = ({
    coreMetrics,
    isLoading,
    isDark,
    index,
    className = "",
    error,
}) => {
    const radarData = React.useMemo(
        () => transformRadarData(coreMetrics ?? []),
        [coreMetrics]
    );

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
                        <MdInsights
                            className={
                                isDark
                                    ? "text-brand-primary-dark"
                                    : "text-brand-primary-light"
                            }
                        />
                        Core Skill Progress
                    </h3>
                    <p
                        className={`text-sm mt-1 ${
                            isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                        }`}
                    >
                        Your core comprehension skills with proficiency scores (0-100) and detailed descriptions.
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
                        Error loading skill progress.
                    </div>
                ) : isLoading ? (
                    <div className="space-y-3">
                        <div className="animate-pulse h-64 rounded-xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                        <div className="animate-pulse h-4 w-3/4 rounded bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                    </div>
                ) : (!radarData || radarData.length === 0) ? (
                    <div
                        className={`text-sm ${
                            isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                        }`}
                    >
                        Not enough core-skill data yet. Complete more practice sessions
                        to see your skill progress.
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="h-64 md:h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={radarData}
                                    layout="vertical"
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        horizontal={false}
                                        stroke={isDark ? "#3f3f46" : "#e4e4e7"}
                                    />
                                    <XAxis
                                        type="number"
                                        domain={[0, 100]}
                                        tick={{ fill: isDark ? "#d4d4d8" : "#3f3f46", fontSize: 11 }}
                                        label={{ value: "Proficiency Score (0-100)", position: "insideBottom", offset: -5, fill: isDark ? "#d4d4d8" : "#3f3f46" }}
                                    />
                                    <YAxis
                                        dataKey="skill"
                                        type="category"
                                        tick={{ fill: isDark ? "#d4d4d8" : "#3f3f46", fontSize: 11, width: 180 }}
                                        width={200}
                                    />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="score" barSize={24} radius={[4, 4, 4, 4]}>
                                        {radarData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={trendToColor(entry.trend, isDark)}
                                                fillOpacity={entry.confidence || 1}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-4">
                            <h4 className={`font-semibold text-lg ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                Skill Descriptions
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {radarData.map((skill, index) => {
                                    const metricDef = coreMetricsDefinition.metrics.find(
                                        m => m.metric_key === skill.skill
                                    );
                                    return (
                                        <div
                                            key={skill.skill}
                                            className={`p-3 rounded-lg border ${isDark ? "bg-bg-tertiary-dark border-border-dark" : "bg-bg-tertiary-light border-border-light"}`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0`} style={{ backgroundColor: trendToColor(skill.trend, isDark) }}></div>
                                                <div>
                                                    <div className={`font-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                                        {skill.skill.replace(/_/g, ' ')}
                                                    </div>
                                                    <div className={`text-sm mt-1 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                                        {metricDef ? metricDef.description : 'Skill description not available'}
                                                    </div>
                                                    <div className={`text-xs mt-2 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
                                                        <span className="font-medium">Score:</span> {skill.score}/100 •
                                                        <span className="font-medium">Confidence:</span> {(skill.confidence * 100).toFixed(0)}% •
                                                        <span className="font-medium capitalize">Trend:</span> {skill.trend}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div
                            className={`mt-4 text-xs ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}
                        >
                            Bar color indicates trend (green improving, red declining, gray stagnant). Opacity reflects confidence level.
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
