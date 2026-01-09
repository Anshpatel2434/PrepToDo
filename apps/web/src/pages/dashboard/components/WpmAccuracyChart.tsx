import React from "react";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface WpmAccuracyChartProps {
    data: any[];
    isDark: boolean;
}

export const WpmAccuracyChart: React.FC<WpmAccuracyChartProps> = ({ data, isDark }) => {
    const chartData = data
        .filter(s => s.wpm > 0)
        .map((s) => ({
            wpm: s.wpm,
            accuracy: s.accuracy,
            date: new Date(s.completed_at).toLocaleDateString(),
        }));

    if (chartData.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Not enough session data for WPM analysis
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                    <XAxis
                        type="number"
                        dataKey="wpm"
                        name="WPM"
                        unit=" wpm"
                        tick={{ fill: isDark ? "#9ca3af" : "#4b5563", fontSize: 10 }}
                    />
                    <YAxis
                        type="number"
                        dataKey="accuracy"
                        name="Accuracy"
                        unit="%"
                        domain={[0, 100]}
                        tick={{ fill: isDark ? "#9ca3af" : "#4b5563", fontSize: 10 }}
                    />
                    <ZAxis type="category" dataKey="date" name="Date" />
                    <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        contentStyle={{
                            backgroundColor: isDark ? "#1f2937" : "#fff",
                            borderColor: isDark ? "#374151" : "#e5e7eb",
                            color: isDark ? "#f3f4f6" : "#1f2937",
                        }}
                    />
                    <Scatter name="Sessions" data={chartData} fill="#8884d8" />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};
