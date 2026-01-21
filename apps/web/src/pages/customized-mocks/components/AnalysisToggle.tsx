import React from "react";
import { motion } from "framer-motion";

export type AnalysisViewType = "solution" | "analysis";

interface AnalysisToggleProps {
    value: AnalysisViewType;
    onChange: (value: AnalysisViewType) => void;
    isDark: boolean;
}

export const AnalysisToggle: React.FC<AnalysisToggleProps> = ({
    value,
    onChange,
    isDark,
}) => {
    const getBtnStyle = (type: AnalysisViewType) => {
        const isActive = value === type;
        if (isActive) {
            return `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isDark
                    ? "bg-brand-primary-dark text-white shadow-lg"
                    : "bg-brand-primary-light text-white shadow-lg"
                }`;
        }
        return `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isDark
                ? "text-text-muted-dark hover:text-text-primary-dark"
                : "text-text-muted-light hover:text-text-primary-light"
            }`;
    };

    return (
        <div
            className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"
                }`}
        >
            <motion.button
                onClick={() => onChange("solution")}
                className={getBtnStyle("solution")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                Solutions
            </motion.button>

            <motion.button
                onClick={() => onChange("analysis")}
                className={getBtnStyle("analysis")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                Analysis
            </motion.button>
        </div>
    );
};
