import React from "react";
import { motion } from "framer-motion";
import type { UserMetricProficiency } from "../../../types";
import { AlertTriangle } from "lucide-react";

interface LogicGapPanelProps {
    data: UserMetricProficiency[];
    isDark: boolean;
}

export const LogicGapPanel: React.FC<LogicGapPanelProps> = ({ data, isDark }) => {
    const errorPatterns = data
        .filter((p) => p.dimension_type === "error_pattern")
        .sort((a, b) => b.total_attempts - a.total_attempts)
        .slice(0, 4);

    if (errorPatterns.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
                No error patterns identified yet
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {errorPatterns.map((pattern, idx) => (
                <motion.div
                    key={pattern.dimension_key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                        isDark ? "bg-white/5" : "bg-black/5"
                    }`}
                >
                    <div className="mt-1">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                        <div className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                            {pattern.dimension_key.replace(/_/g, " ")}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="text-xs text-gray-500">
                                {pattern.total_attempts} occurrences
                            </div>
                            <div className={`text-xs px-1.5 py-0.5 rounded ${
                                pattern.trend === 'improving' ? 'bg-green-500/10 text-green-500' :
                                pattern.trend === 'declining' ? 'bg-red-500/10 text-red-500' :
                                'bg-gray-500/10 text-gray-500'
                            }`}>
                                {pattern.trend || 'stable'}
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
