import React from "react";
import { motion } from "framer-motion";
import { MdInsights, MdTrendingUp, MdTrendingDown, MdTrendingFlat } from "react-icons/md";
import {
    Radar,
    RadarChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
    const { cx, cy, payload, isDark } = props;
    const color = trendToColor(payload?.trend, Boolean(isDark));
    const opacity = typeof payload?.confidence === "number" ? payload.confidence : 1;

    if (typeof cx !== "number" || typeof cy !== "number") return null;

    return (
        <circle
            cx={cx}
            cy={cy}
            r={6}
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={opacity}
        />
    );
}

function getTrendIcon(trend: string | null | undefined, isDark: boolean) {
    const color = trendToColor(trend, isDark);
    if (trend === "improving") return <MdTrendingUp className="text-green-500" size={16} />;
    if (trend === "declining") return <MdTrendingDown className="text-red-500" size={16} />;
    return <MdTrendingFlat className="text-gray-500" size={16} />;
}

function getScoreEmoji(score: number) {
    if (score >= 80) return "🌟";
    if (score >= 60) return "👍";
    if (score >= 40) return "🤔";
    return "😕";
}

function getConfidenceEmoji(confidence: number) {
    if (confidence >= 0.8) return "💯";
    if (confidence >= 0.6) return "👌";
    if (confidence >= 0.4) return "🤷";
    return "❓";
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
            className={`rounded-2xl border p-5 overflow-hidden transition-colors ${
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
                        Core Skill Radar
                    </h3>
                    <p
                        className={`text-sm mt-1 ${
                            isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                        }`}
                    >
                        Visual representation of your comprehension skills (0–100).
                    </p>
                </div>
            </div>

            <div className="mt-5">
                {error ? (
                    <div
                        className={`text-sm ${
                            isDark ? "text-rose-300" : "text-rose-700"
                        }`}
                    >
                        Error loading skill radar.
                    </div>
                ) : isLoading ? (
                    <div className="space-y-2">
                        <div className="animate-pulse h-40 rounded-xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                        <div className="animate-pulse h-3 w-2/3 rounded bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                    </div>
                ) : radarData.length < 3 ? (
                    <div
                        className={`text-sm ${
                            isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                        }`}
                    >
                        Not enough core-skill data yet. Complete more practice sessions
                        to see your radar chart.
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData} outerRadius="70%">
                                    <PolarGrid
                                        stroke={isDark ? "#3f3f46" : "#e4e4e7"}
                                    />
                                    <PolarAngleAxis
                                        dataKey="skill"
                                        tick={{
                                            fill: isDark ? "#d4d4d8" : "#3f3f46",
                                            fontSize: 11,
                                        }}
                                    />
                                    <PolarRadiusAxis
                                        angle={90}
                                        domain={[0, 100]}
                                        tick={{
                                            fill: isDark ? "#a1a1aa" : "#71717a",
                                            fontSize: 10,
                                        }}
                                    />

                                    <Radar
                                        dataKey="score"
                                        stroke={isDark ? "#34d399" : "#16a34a"}
                                        fill={isDark ? "#16a34a" : "#059669"}
                                        fillOpacity={0.2}
                                        dot={(p) => (
                                            <CustomDot {...p} isDark={isDark} />
                                        )}
                                    />

                                    <Tooltip contentStyle={tooltipStyle} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {radarData.slice(0, 4).map((skill, index) => {
                                const metricDef = coreMetricsDefinition.metrics.find(
                                    m => m.metric_key === skill.skill
                                );
                                
                                const scoreColor = skill.score >= 70 ? 
                                    (isDark ? "text-green-400" : "text-green-600") : 
                                    (skill.score >= 40 ? 
                                        (isDark ? "text-yellow-400" : "text-yellow-600") : 
                                        (isDark ? "text-red-400" : "text-red-600"));
                                
                                const confidenceColor = skill.confidence >= 0.7 ? 
                                    (isDark ? "text-blue-400" : "text-blue-600") : 
                                    (skill.confidence >= 0.4 ? 
                                        (isDark ? "text-purple-400" : "text-purple-600") : 
                                        (isDark ? "text-gray-400" : "text-gray-600"));

                                return (
                                    <motion.div
                                        key={skill.skill}
                                        whileHover={{ scale: 1.02 }}
                                        className={`p-2 rounded-lg border ${isDark ? "bg-bg-tertiary-dark border-border-dark" : "bg-bg-tertiary-light border-border-light"}`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="flex-shrink-0">
                                                {getTrendIcon(skill.trend, isDark)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className={`font-medium truncate ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                                    {skill.skill.replace(/_/g, ' ')}
                                                </div>
                                                <div className={`text-xs mt-1 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
                                                    <span className={scoreColor}>
                                                        {getScoreEmoji(skill.score)} {skill.score}/100
                                                    </span> • 
                                                    <span className={confidenceColor}>
                                                        {getConfidenceEmoji(skill.confidence)} {(skill.confidence * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                {metricDef && (
                                                    <div className={`text-xs mt-2 italic ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                                        "{metricDef.description.split('.')[0]}."
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div
                            className={`text-xs ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}
                        >
                            {getTrendIcon("improving", isDark)} Improving • {getTrendIcon("declining", isDark)} Declining • {getTrendIcon("stagnant", isDark)} Stable
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};