import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { UserMetricProficiency } from "../../../types";

interface SkillRadarProps {
    coreMetrics: UserMetricProficiency[];
    isLoading: boolean;
    isDark: boolean;
}

// Map dimension_key to readable labels
const dimensionLabels: Record<string, string> = {
    inference: "Inference",
    main_idea: "Main Idea",
    detail_comprehension: "Detail",
    tone_analysis: "Tone",
    vocabulary: "Vocabulary",
    critical_reasoning: "Critical Reasoning",
    para_jumble: "Para Jumble",
    para_summary: "Para Summary",
    logical_connectives: "Connectives",
    sentence_completion: "Sentence Completion",
    factual_recall: "Factual Recall",
    contextual_meaning: "Contextual",
};

const defaultLabels = [
    "Inference",
    "Main Idea",
    "Detail",
    "Tone",
    "Vocabulary",
    "Critical Reasoning",
];

const getLabel = (key: string) => dimensionLabels[key] || key;

const RadarChart: React.FC<{
    data: Array<{ label: string; score: number }>;
    isDark: boolean;
}> = ({ data, isDark }) => {
    const size = 200;
    const center = size / 2;
    const radius = 80;
    const levels = 5;

    const normalizedData = useMemo(() => {
        const maxItems = 6;
        const items = [...data];
        while (items.length < maxItems) {
            items.push({ label: "", score: 0 });
        }
        return items.slice(0, maxItems);
    }, [data]);

    const angleSlice = (Math.PI * 2) / normalizedData.length;

    const points = useMemo(() => {
        return normalizedData.map((item, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const r = (item.score / 100) * radius;
            return {
                x: center + r * Math.cos(angle),
                y: center + r * Math.sin(angle),
                score: item.score,
                label: item.label,
            };
        });
    }, [normalizedData, center, radius, angleSlice]);

    const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
    const textColor = isDark ? "#9ca3af" : "#6b7280";
    const lineColor = isDark ? "#3b82f6" : "#6366f1";
    const fillColor = isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(99, 102, 241, 0.2)";

    return (
        <svg width={size} height={size} className="overflow-visible">
            {/* Grid circles */}
            {Array.from({ length: levels }, (_, i) => (
                <circle
                    key={i}
                    cx={center}
                    cy={center}
                    r={(radius / levels) * (i + 1)}
                    fill="none"
                    stroke={gridColor}
                    strokeWidth="1"
                />
            ))}

            {/* Axis lines */}
            {normalizedData.map((_, i) => {
                const angle = angleSlice * i - Math.PI / 2;
                return (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={center + radius * Math.cos(angle)}
                        y2={center + radius * Math.sin(angle)}
                        stroke={gridColor}
                        strokeWidth="1"
                    />
                );
            })}

            {/* Data polygon */}
            {points.length >= 3 && (
                <motion.polygon
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill={fillColor}
                    stroke={lineColor}
                    strokeWidth="2"
                />
            )}

            {/* Points and labels */}
            {points.map((point, i) => (
                <g key={i}>
                    <motion.circle
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        cx={point.x}
                        cy={point.y}
                        r={4}
                        fill={lineColor}
                    />
                    {point.label && (
                        <text
                            x={point.x}
                            y={point.y + (point.y > center ? 20 : -12)}
                            textAnchor="middle"
                            fill={textColor}
                            fontSize="10"
                            fontWeight="500"
                        >
                            {point.label}
                        </text>
                    )}
                </g>
            ))}
        </svg>
    );
};

export const SkillRadar: React.FC<SkillRadarProps> = ({
    coreMetrics,
    isLoading,
    isDark,
}) => {
    const chartData = useMemo(() => {
        if (!coreMetrics || coreMetrics.length === 0) {
            return defaultLabels.map((label) => ({ label, score: 50 + Math.random() * 20 }));
        }
        return coreMetrics.slice(0, 6).map((m) => ({
            label: getLabel(m.dimension_key),
            score: m.proficiency_score,
        }));
    }, [coreMetrics]);

    const avgScore = useMemo(() => {
        if (!coreMetrics || coreMetrics.length === 0) return 0;
        const total = coreMetrics.reduce((sum, m) => sum + m.proficiency_score, 0);
        return Math.round(total / coreMetrics.length);
    }, [coreMetrics]);

    return (
        <motion.section
            className={`rounded-2xl border ${
                isDark
                    ? "bg-bg-secondary-dark border-border-dark"
                    : "bg-bg-secondary-light border-border-light"
            } p-5`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.2 }}
        >
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <h2
                            className={`text-base sm:text-lg font-semibold tracking-tight ${
                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                        >
                            🎯 Skill Radar
                        </h2>
                        <span
                            className={`text-xs px-2 py-1 rounded-lg border ${
                                isDark
                                    ? "border-border-dark bg-bg-tertiary-dark/40 text-text-muted-dark"
                                    : "border-border-light bg-bg-tertiary-light/50 text-text-muted-light"
                            }`}
                        >
                            Core Skills
                        </span>
                    </div>
                    <p
                        className={`text-sm ${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                    >
                        Proficiency across core skill dimensions
                    </p>
                </div>

                {/* Average Score Badge */}
                <div
                    className={`rounded-xl px-3 py-2 ${
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
                        Avg Score
                    </div>
                    <div
                        className={`text-xl font-bold ${
                            isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}
                    >
                        {avgScore}%
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center mt-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-52 w-52">
                        <div
                            className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                                isDark ? "border-brand-primary-dark" : "border-brand-primary-light"
                            }`}
                        />
                    </div>
                ) : coreMetrics && coreMetrics.length === 0 ? (
                    <div
                        className={`flex flex-col items-center justify-center h-52 w-52 ${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                    >
                        <span className="text-4xl mb-2">📊</span>
                        <span className="text-sm text-center">Complete more practice to see your skills</span>
                    </div>
                ) : (
                    <RadarChart data={chartData} isDark={isDark} />
                )}
            </div>

            {/* Legend / Breakdown */}
            {coreMetrics && coreMetrics.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {coreMetrics.slice(0, 6).map((metric) => (
                        <div
                            key={metric.id}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                                isDark
                                    ? "bg-bg-tertiary-dark/30"
                                    : "bg-bg-tertiary-light/50"
                            }`}
                        >
                            <span
                                className={`text-xs truncate ${
                                    isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                }`}
                            >
                                {getLabel(metric.dimension_key)}
                            </span>
                            <span
                                className={`text-xs font-semibold ${
                                    metric.proficiency_score >= 70
                                        ? "text-green-500"
                                        : metric.proficiency_score >= 50
                                        ? "text-yellow-500"
                                        : "text-red-500"
                                }`}
                            >
                                {metric.proficiency_score}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </motion.section>
    );
};

export default SkillRadar;
