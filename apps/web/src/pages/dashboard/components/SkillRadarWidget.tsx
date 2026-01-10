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
            r={4}
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={opacity}
        />
    );
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
                        Skill Radar
                    </h3>
                    <p
                        className={`text-sm mt-1 ${
                            isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                        }`}
                    >
                        Core comprehension skills (0–100).
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
                        Error loading skill radar.
                    </div>
                ) : isLoading ? (
                    <div className="space-y-3">
                        <div className="animate-pulse h-48 rounded-xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                        <div className="animate-pulse h-4 w-3/4 rounded bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
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
                                        isDark ? "#22c55e" : "#16a34a"
                                    }
                                    fill={isDark ? "#22c55e" : "#16a34a"}
                                    fillOpacity={0.15}
                                    dot={(p) => (
                                        <CustomDot {...p} isDark={isDark} />
                                    )}
                                />

                                <Tooltip contentStyle={tooltipStyle} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {!isLoading && radarData.length >= 3 && (
                    <div
                        className={`mt-4 text-xs ${
                            isDark
                                ? "text-text-muted-dark"
                                : "text-text-muted-light"
                        }`}
                    >
                        Dot color indicates trend (green improving, red declining, gray
                        stagnant). Opacity reflects confidence.
                    </div>
                )}
            </div>
        </motion.div>
    );
};
