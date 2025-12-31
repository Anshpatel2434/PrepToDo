import React, { useState } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
    MdOutlineSentimentDissatisfied,
    MdOutlineSentimentNeutral,
    MdOutlineSentimentSatisfied,
} from "react-icons/md";
import {
    selectAttempts,
    selectPendingAttempts,
    selectCurrentQuestionId,
    updateConfidenceLevel,
} from "../redux_usecase/dailyPracticeSlice";

interface ConfidenceSelectorProps {
    isDark: boolean;
    disabled?: boolean;
}

export const ConfidenceSelector: React.FC<ConfidenceSelectorProps> = ({
    isDark,
    disabled = false,
}) => {
    const dispatch = useDispatch();

    const attempts = useSelector(selectAttempts);
    const pendingAttempts = useSelector(selectPendingAttempts);
    const currentQuestionId = useSelector(selectCurrentQuestionId);

    // Get current attempt (check pending first, then saved)
    const currentAttempt = currentQuestionId
        ? pendingAttempts[currentQuestionId] || attempts[currentQuestionId]
        : undefined;

    // Get confidence from current attempt (pending or saved)
    const currentConfidence = currentAttempt?.confidence_level || 0;
    const [confidenceLevel, setConfidenceLevel] = useState<number>(currentConfidence);

    // Update local state when Redux state changes
    React.useEffect(() => {
        if (currentConfidence > 0) {
            setConfidenceLevel(currentConfidence);
        }
    }, [currentConfidence]);

    const options = [
        {
            level: 1,
            label: "Low",
            icon: MdOutlineSentimentDissatisfied,
            color: "error",
        },
        {
            level: 2,
            label: "Med",
            icon: MdOutlineSentimentNeutral,
            color: "warning",
        },
        {
            level: 3,
            label: "High",
            icon: MdOutlineSentimentSatisfied,
            color: "success",
        },
    ];

    const getOptionStyles = (level: number) => {
        const baseStyles = `
            flex items-center gap-2 px-4 py-2 rounded-xl border-2
            transition-all duration-200
        `;

        const isSelected = confidenceLevel === level;

        if (isSelected) {
            if (level === 1) {
                return `${baseStyles} bg-error/20 border-error text-error`;
            } else if (level === 2) {
                return `${baseStyles} bg-warning/20 border-warning text-warning`;
            } else {
                return `${baseStyles} bg-success/20 border-success text-success`;
            }
        }

        return `${baseStyles} ${isDark
                ? "bg-bg-tertiary-dark border-border-dark text-text-muted-dark"
                : "bg-bg-tertiary-light border-border-light text-text-muted-light"
            } hover:border-brand-primary-${isDark ? "dark" : "light"}`;
    };

    return (
        <div className="flex flex-col gap-2">
            <label
                className={`
                text-xs font-medium uppercase tracking-wide
                ${isDark
                        ? "text-text-secondary-dark"
                        : "text-text-secondary-light"
                    }
            `}
            >
                Confidence
            </label>
            <div className="flex gap-2">
                {options.map((option) => {
                    const Icon = option.icon;
                    return (
                        <motion.button
                            key={option.level}
                            onClick={() => {
                                setConfidenceLevel(option.level);
                                !disabled &&
                                    currentQuestionId &&
                                    dispatch(
                                        updateConfidenceLevel({
                                            questionId: currentQuestionId,
                                            confidence_level: option.level,
                                        })
                                    );
                            }}
                            className={getOptionStyles(option.level)}
                            disabled={disabled}
                            whileHover={!disabled ? { scale: 1.02 } : {}}
                            whileTap={!disabled ? { scale: 0.98 } : {}}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{option.label}</span>
                        </motion.button>
                    );
                })}
            </div>
            {confidenceLevel > 0 && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`
                        text-xs mt-1
                        ${isDark
                            ? "text-text-muted-dark"
                            : "text-text-muted-light"
                        }
                    `}
                >
                    {confidenceLevel === 1 && "Not very sure about this answer"}
                    {confidenceLevel === 2 && "Somewhat confident"}
                    {confidenceLevel === 3 && "Very confident"}
                </motion.p>
            )}
        </div>
    );
};

export default ConfidenceSelector;
