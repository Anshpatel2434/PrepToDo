import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import type { UserMetricProficiency } from "../../../types";

interface GenreHeatmapProps {
    data: UserMetricProficiency[];
    isDark: boolean;
}

export const GenreHeatmap: React.FC<GenreHeatmapProps> = ({ data, isDark }) => {
    const genreData = data
        .filter((p) => p.dimension_type === "genre")
        .map((p) => ({
            name: p.dimension_key,
            score: p.proficiency_score,
        }))
        .sort((a, b) => b.score - a.score);

    if (genreData.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
                No genre data available
            </div>
        );
    }

    const getColor = (score: number) => {
        if (score >= 80) return "#22c55e";
        if (score >= 60) return "#84cc16";
        if (score >= 40) return "#eab308";
        if (score >= 20) return "#f97316";
        return "#ef4444";
    };

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={genreData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#374151" : "#e5e7eb"} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: isDark ? "#9ca3af" : "#4b5563", fontSize: 10 }}
                        width={80}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? "#1f2937" : "#fff",
                            borderColor: isDark ? "#374151" : "#e5e7eb",
                            color: isDark ? "#f3f4f6" : "#1f2937",
                        }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {genreData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getColor(entry.score)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
