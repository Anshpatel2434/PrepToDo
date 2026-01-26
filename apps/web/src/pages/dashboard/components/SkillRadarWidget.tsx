import React from "react";
import { motion } from "framer-motion";
import { MdInsights } from "react-icons/md";
import {
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import type { UserMetricProficiency } from "../../../types";
import { transformRadarData, trendToColor } from "../utils/chartHelpers";
import { coreMetricsDefinition } from "../config/user_core_metrics_definition_v1";
import { metricMappingJson } from "../config/core_metric_reasoning_map_v1_0";

interface SkillRadarWidgetProps {
    coreMetrics: UserMetricProficiency[] | undefined;
    isLoading: boolean;
    isDark: boolean;
    index: number;
    className?: string;
    error?: unknown;
}

interface CustomDotProps {
    cx?: number;
    cy?: number;
    payload?: {
        trend?: "improving" | "declining" | "stagnant";
        skill?: string;
        confidence?: number
    };
    isDark?: boolean;
    metricData?: UserMetricProficiency[];
}

function CustomDot(props: CustomDotProps) {
    const { cx, cy, payload, isDark, metricData } = props;
    const color = trendToColor(payload?.trend, Boolean(isDark));
    const opacity = typeof payload?.confidence === "number" ? payload.confidence : 1;

    // Find the original metric data to get attempts and confidence
    const originalMetric = metricData?.find((m) => m.dimension_key === payload?.skill);
    const hasLowAttempts = (originalMetric?.total_attempts || 0) < 10;
    const confidenceScore = originalMetric?.confidence_score || payload?.confidence || 1;

    // Stroke thickness based on confidence (thinner = less confident)
    const strokeWidth = 1 + (confidenceScore * 3); // 1-4px based on confidence

    if (typeof cx !== "number" || typeof cy !== "number") return null;

    return (
        <g>
            <circle
                cx={cx}
                cy={cy}
                r={4}
                stroke={color}
                strokeWidth={strokeWidth}
                fill={color}
                fillOpacity={opacity}
                strokeDasharray={hasLowAttempts ? "2,2" : undefined}
            />
            {/* Trend indicator */}
            {payload?.trend && (
                <text
                    x={cx + 8}
                    y={cy - 8}
                    fontSize="10"
                    fill={color}
                    textAnchor="middle"
                >
                    {payload.trend === 'improving' ? '↑' :
                        payload.trend === 'declining' ? '↓' : '→'}
                </text>
            )}
        </g>
    );
}

function getCognitiveFailureReason(metricKey: string): string {
    const steps = metricMappingJson.metrics[metricKey as keyof typeof metricMappingJson.metrics];
    if (!steps || !steps.reasoning_steps || steps.reasoning_steps.length === 0) {
        return "Insufficient practice data to identify specific reasoning patterns.";
    }

    return steps.reasoning_steps[0].label;
}

export const SkillRadarWidget: React.FC<SkillRadarWidgetProps> = ({
    coreMetrics,
    isLoading,
    isDark,
    index,
    className = "",
    error,
}) => {
    // Filter out reading_speed_wpm and ensure we have exactly 10 core metrics
    const validCoreMetrics = React.useMemo(() => {
        return (coreMetrics ?? [])
            .filter(m => m.dimension_key !== 'reading_speed_wpm')
            .slice(0, 10);
    }, [coreMetrics]);

    const radarData = React.useMemo(
        () => transformRadarData(validCoreMetrics),
        [validCoreMetrics]
    );

    const tooltipStyle = React.useMemo(() => {
        return {
            backgroundColor: isDark ? "#18181b" : "#ffffff",
            border: `1px solid ${isDark ? "#3f3f46" : "#e4e4e7"}`,
            borderRadius: 12,
            color: isDark ? "#fafafa" : "#18181b",
        };
    }, [isDark]);

    const weakestMetrics = React.useMemo(() => {
        return [...validCoreMetrics]
            .sort((a, b) => a.proficiency_score - b.proficiency_score)
            .slice(0, 3);
    }, [validCoreMetrics]);

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
                        <MdInsights
                            className={
                                isDark
                                    ? "text-brand-primary-dark"
                                    : "text-brand-primary-light"
                            }
                        />
                        Cognitive Skill Map
                    </h3>
                    <p
                        className={`text-sm mt-1 ${isDark
                            ? "text-text-secondary-dark"
                            : "text-text-secondary-light"
                            }`}
                    >
                        Your thinking patterns and cognitive strengths visualized.
                    </p>
                </div>
            </div>

            <div className="mt-6">
                {error ? (
                    <div
                        className={`text-sm ${isDark ? "text-rose-300" : "text-rose-700"
                            }`}
                    >
                        Error loading skill radar.
                    </div>
                ) : isLoading ? (
                    <div className="space-y-3">
                        <div className="animate-pulse h-48 rounded-xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                        <div className="animate-pulse h-4 w-3/4 rounded bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                    </div>
                ) : radarData.length < 3 ? (
                    <div
                        className={`text-sm ${isDark
                            ? "text-text-secondary-dark"
                            : "text-text-secondary-light"
                            }`}
                    >
                        Not enough core-skill data yet. Complete more practice sessions
                        to see your radar chart.
                    </div>
                ) : (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData} outerRadius="75%">
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
                                    stroke={
                                        isDark ? "#3b82f6" : "#0f4c81"
                                    }
                                    fill={isDark ? "#3b82f6" : "#0f4c81"}
                                    fillOpacity={0.25}
                                    strokeWidth={2}
                                    dot={(p) => (
                                        <CustomDot {...p} isDark={isDark} metricData={validCoreMetrics} />
                                    )}
                                />

                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length > 0) {
                                            const data = payload[0].payload;
                                            return (
                                                <div style={tooltipStyle} className="p-3 text-xs">
                                                    <div className="font-semibold mb-1">{data.skill}</div>
                                                    <div>Proficiency: {data.score}/100</div>
                                                    <div>Confidence: {Math.round((data.confidence || 0) * 100)}%</div>
                                                    <div>Trend: {data.trend || 'stagnant'}</div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {!isLoading && radarData.length >= 3 && (
                    <>
                        <div
                            className={`mt-4 text-xs ${isDark
                                ? "text-text-muted-dark"
                                : "text-text-muted-light"
                                }`}
                        >
                            Chart shows your cognitive skill profile. Thicker dots = higher confidence.
                            <br />Shape asymmetry reveals your thinking patterns and imbalances.
                        </div>

                        {/* Action Strip - Cognitive Analysis */}
                        {weakestMetrics.length > 0 && (
                            <div className={`mt-6 p-4 rounded-xl border ${isDark
                                ? "bg-rose-900/20 border-rose-800/30"
                                : "bg-rose-50 border-rose-200"
                                }`}>
                                <div className={`flex items-center gap-2 mb-3 ${isDark ? "text-rose-300" : "text-rose-700"
                                    }`}>
                                    <MdInsights size={18} />
                                    <h4 className="font-semibold">Cognitive Focus Areas</h4>
                                </div>

                                <div className="space-y-3">
                                    {weakestMetrics.map((metric, index) => {
                                        const metricDef = coreMetricsDefinition.metrics.find(
                                            m => m.metric_key === metric.dimension_key
                                        );
                                        const displayName = metricDef ? metricDef.metric_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : metric.dimension_key;

                                        return (
                                            <div key={metric.id} className="border-l-4 pl-3"
                                                style={{ borderColor: isDark ? '#ef4444' : '#dc2626' }}>
                                                <div className={`text-sm font-semibold mb-1 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                                    }`}>
                                                    #{index + 1} {displayName}
                                                </div>
                                                <div className={`text-xs mb-2 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                                    }`}>
                                                    What's failing: {getCognitiveFailureReason(metric.dimension_key)}
                                                </div>
                                                <div className={`text-xs font-medium flex items-center gap-1 ${isDark ? "text-rose-300" : "text-rose-700"
                                                    }`}>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className={`mt-4 pt-3 border-t text-xs ${isDark
                                    ? "border-rose-800/30 text-rose-300/70"
                                    : "border-rose-200 text-rose-600/70"
                                    }`}>
                                    Focus on these areas to strengthen your cognitive foundation and improve overall performance.
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
};
