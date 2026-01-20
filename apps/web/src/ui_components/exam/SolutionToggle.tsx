import React from "react";
import { motion } from "framer-motion";

export type SolutionViewType = "common" | "personalized";

interface SolutionToggleProps {
    value: SolutionViewType;
    onChange: (value: SolutionViewType) => void;
    hasPersonalizedRationale: boolean;
    isDark: boolean;
}

export const SolutionToggle: React.FC<SolutionToggleProps> = ({
    value,
    onChange,
    hasPersonalizedRationale,
    isDark,
}) => {
    const getBtnStyle = (type: SolutionViewType) => {
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
                onClick={() => onChange("common")}
                className={getBtnStyle("common")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                Common Solution
            </motion.button>

            {hasPersonalizedRationale && (
                <motion.button
                    onClick={() => onChange("personalized")}
                    className={getBtnStyle("personalized")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    AI Insights
                </motion.button>
            )}
        </div>
    );
};
