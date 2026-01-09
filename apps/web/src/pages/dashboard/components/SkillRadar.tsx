import React from "react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
} from "recharts";
import type { UserMetricProficiency } from "../../../types";

interface SkillRadarProps {
    data: UserMetricProficiency[];
    isDark: boolean;
}

export const SkillRadar: React.FC<SkillRadarProps> = ({ data, isDark }) => {
    const radarData = data
        .filter((p) => p.dimension_type === "core_metric")
        .map((p) => ({
            subject: p.dimension_key.replace(/_/g, " ").toUpperCase(),
            A: p.proficiency_score,
            fullMark: 100,
        }));

    if (radarData.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
                No core skill data available
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke={isDark ? "#374151" : "#e5e7eb"} />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: isDark ? "#9ca3af" : "#4b5563", fontSize: 10 }}
                    />
                    <Radar
                        name="Skills"
                        dataKey="A"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};
