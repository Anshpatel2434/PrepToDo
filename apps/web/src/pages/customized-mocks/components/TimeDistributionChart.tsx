import React from "react";
import { motion } from "framer-motion";

interface TimeDistributionChartProps {
    timeDistribution: {
        correct: number;
        incorrect: number;
        unattempted: number;
        total: number;
    };
    timeDistributionPercent: {
        correct: number;
        incorrect: number;
        unattempted: number;
    };
    isDark: boolean;
}

export const TimeDistributionChart: React.FC<TimeDistributionChartProps> = ({
    timeDistribution,
    timeDistributionPercent,
    isDark,
}) => {
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) {
            return `${secs}s`;
        }
        return `${mins}m ${secs}s`;
    };

    const data = [
        {
            label: "Correct",
            value: timeDistribution.correct,
            percent: timeDistributionPercent.correct,
            color: "#22c55e", // green-500
        },
        {
            label: "Incorrect",
            value: timeDistribution.incorrect,
            percent: timeDistributionPercent.incorrect,
            color: "#ef4444", // red-500
        },
        {
            label: "Unattempted",
            value: timeDistribution.unattempted,
            percent: timeDistributionPercent.unattempted,
            color: "#9ca3af", // gray-400
        },
    ].filter(item => item.value > 0); // Only show segments with time spent

    // Calculate SVG pie chart paths
    const calculatePieSegments = () => {
        const radius = 80;
        const centerX = 100;
        const centerY = 100;
        let currentAngle = -90; // Start from top

        return data.map((item) => {
            const angleSize = (item.percent / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angleSize;

            const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
            const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
            const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
            const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

            const largeArcFlag = angleSize > 180 ? 1 : 0;

            const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${startX} ${startY}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                'Z',
            ].join(' ');

            currentAngle = endAngle;

            return {
                ...item,
                path: pathData,
            };
        });
    };

    const segments = calculatePieSegments();

    if (timeDistribution.total === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className={`rounded-2xl p-6 shadow-lg ${isDark ? "bg-bg-secondary-dark" : "bg-bg-secondary-light"
                    }`}
            >
                <h2
                    className={`text-lg font-semibold mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}
                >
                    Time Distribution
                </h2>
                <div className="flex items-center justify-center h-64">
                    <p
                        className={`text-sm ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                    >
                        No time data available
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`rounded-2xl p-6 shadow-lg ${isDark ? "bg-bg-secondary-dark" : "bg-bg-secondary-light"
                }`}
        >
            <h2
                className={`text-lg font-semibold mb-6 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                    }`}
            >
                Time Distribution
            </h2>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                {/* Pie Chart */}
                <div className="relative">
                    <svg width="200" height="200" viewBox="0 0 200 200">
                        {segments.map((segment, index) => (
                            <motion.path
                                key={segment.label}
                                d={segment.path}
                                fill={segment.color}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                            />
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div
                                className={`text-2xl font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                    }`}
                            >
                                {formatTime(timeDistribution.total)}
                            </div>
                            <div
                                className={`text-xs ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                    }`}
                            >
                                Total Time
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="space-y-3">
                    {data.map((item, index) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                            className="flex items-center gap-3"
                        >
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: item.color }}
                            ></div>
                            <div className="flex-1">
                                <div
                                    className={`text-sm font-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                        }`}
                                >
                                    {item.label}
                                </div>
                                <div
                                    className={`text-xs ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                        }`}
                                >
                                    {formatTime(item.value)} ({item.percent}%)
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
