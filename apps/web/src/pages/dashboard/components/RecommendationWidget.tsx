import React from "react";
import { motion } from "framer-motion";
import { MdPlayArrow, MdLightbulb } from "react-icons/md";
import type { UserProficiencySignals } from "../../../types";

interface RecommendationWidgetProps {
    signals: UserProficiencySignals | null | undefined;
    isLoading: boolean;
    isDark: boolean;
    index: number;
    className?: string;
    error?: unknown;
}

// Priority card component for focus areas
function PriorityItem({
    priority,
    label,
    description,
    isDark,
}: {
    priority: number;
    label: string;
    description: string;
    isDark: boolean;
}) {
    const priorityColors = {
        1: isDark ? "border-rose-500/20 bg-rose-500/10" : "border-rose-200 bg-rose-50",
        2: isDark ? "border-amber-500/20 bg-amber-500/10" : "border-amber-200 bg-amber-50",
        3: isDark ? "border-blue-500/20 bg-blue-500/10" : "border-blue-200 bg-blue-50",
    };

    const numberColors = {
        1: isDark ? "bg-rose-500/20 text-rose-400" : "bg-rose-100 text-rose-700",
        2: isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700",
        3: isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700",
    };

    const colorClass = priorityColors[priority as keyof typeof priorityColors] || priorityColors[3];
    const numberClass = numberColors[priority as keyof typeof numberColors] || numberColors[3];

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { type: "spring" as const, stiffness: 220, damping: 20 }
        }
    };

    return (
        <motion.div
            variants={itemVariants}
            className={`priority-card rounded-xl border-l-4 p-4 ${colorClass}`}
        >
            <div className={`priority-number ${numberClass}`}>
                {priority}
            </div>
            <div className={`font-medium text-sm ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                }`}>
                {label}
            </div>
            <div className={`text-xs mt-1 leading-relaxed ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                }`}>
                {description}
            </div>
        </motion.div>
    );
}

// Get actionable description for weak topics
function getTopicDescription(topic: string): string {
    const descriptions: Record<string, string> = {
        "inference": "Practice drawing conclusions from implicit information in passages.",
        "tone_detection": "Focus on identifying author's attitude and emotional undertones.",
        "main_idea": "Work on summarizing central arguments and key themes.",
        "vocabulary_context": "Practice decoding word meanings from surrounding context.",
        "logical_reasoning": "Strengthen your ability to follow argument structures.",
        "critical_analysis": "Focus on evaluating strengths and weaknesses of arguments.",
    };

    const key = topic.toLowerCase().replace(/\s+/g, '_');
    return descriptions[key] || `Focus on improving your ${topic.toLowerCase()} skills through targeted practice.`;
}

// Get description for weak question types
function getQuestionTypeDescription(qType: string): string {
    const descriptions: Record<string, string> = {
        "para_summary": "Practice condensing paragraphs into their essential meaning.",
        "para_completion": "Work on understanding logical flow and appropriate conclusions.",
        "para_jumble": "Focus on sequence and chronological/causal connectors.",
        "odd_one_out": "Practice identifying thematic or logical mismatches.",
    };

    const key = qType.toLowerCase().replace(/\s+/g, '_');
    return descriptions[key] || `Dedicate practice time to ${qType} questions.`;
}

export const RecommendationWidget: React.FC<RecommendationWidgetProps> = ({
    signals,
    isLoading,
    isDark,
    index,
    className = "",
    error,
}) => {
    // Combine weak topics and question types into prioritized list
    const focusItems = React.useMemo(() => {
        if (!signals) return [];

        const items: Array<{ label: string; description: string; type: "topic" | "qtype" }> = [];

        // Add weak topics (higher priority)
        (signals.weak_topics ?? []).slice(0, 2).forEach(topic => {
            items.push({
                label: topic,
                description: getTopicDescription(topic),
                type: "topic",
            });
        });

        // Add weak question types
        (signals.weak_question_types ?? []).slice(0, 2).forEach(qType => {
            items.push({
                label: qType,
                description: getQuestionTypeDescription(qType),
                type: "qtype",
            });
        });

        return items.slice(0, 3);
    }, [signals]);

    const hasNoWeakAreas = signals && focusItems.length === 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className={`rounded-2xl overflow-hidden ${isDark
                ? "bg-bg-secondary-dark/40"
                : "bg-white/40"
                } backdrop-blur-sm ${className}`}
        >
            <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="mb-5">
                    <h3 className={`font-bold text-xl sm:text-2xl ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}>
                        Focus Today
                    </h3>
                    <p className={`text-sm mt-1.5 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}>
                        Personalized practice priorities based on your performance.
                    </p>
                </div>

                {/* Content */}
                <div>
                    {error ? (
                        <div className={`text-sm ${isDark ? "text-rose-300" : "text-rose-700"}`}>
                            Error loading recommendations.
                        </div>
                    ) : isLoading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="animate-pulse h-20 rounded-xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                            ))}
                        </div>
                    ) : !signals ? (
                        <div className={`text-sm py-8 text-center ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                            }`}>
                            {/* Complete a few practice sessions to unlock personalized recommendations. */}
                            Coming Soon
                        </div>
                    ) : hasNoWeakAreas ? (
                        <div className={`flex flex-col items-center justify-center py-8 text-center ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                            }`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDark ? "bg-brand-accent-dark/20" : "bg-brand-accent-light/20"
                                }`}>
                                <MdLightbulb className={isDark ? "text-brand-accent-dark" : "text-brand-accent-light"} size={24} />
                            </div>
                            <div className="font-medium mb-1">Great balance!</div>
                            <div className="text-sm">No significant weak areas detected. Keep practicing to maintain your edge.</div>
                        </div>
                    ) : (
                        <>
                            {/* Priority Stack */}
                            <motion.div
                                className="space-y-3 mb-6"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.1 }
                                    }
                                }}
                                initial="hidden"
                                animate="visible"
                            >
                                {focusItems.map((item, i) => (
                                    <PriorityItem
                                        key={`${item.type}-${item.label}`}
                                        priority={i + 1}
                                        label={item.label}
                                        description={item.description}
                                        isDark={isDark}
                                    />
                                ))}
                            </motion.div>

                            {/* Recommended Difficulty & CTA */}
                            <div className={`p-4 rounded-xl border ${isDark
                                ? "bg-linear-to-r from-brand-primary-dark/10 to-brand-accent-dark/10 border-brand-primary-dark/30"
                                : "bg-linear-to-r from-brand-primary-light/5 to-brand-accent-light/5 border-brand-primary-light/20"
                                }`}>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className={`text-xs uppercase tracking-wider font-semibold mb-1 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                            }`}>
                                            Suggested Difficulty
                                        </div>
                                        <div className={`text-lg font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                            }`}>
                                            {signals.recommended_difficulty || "Adaptive"}
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg ${isDark
                                            ? "bg-brand-primary-dark text-white hover:bg-brand-primary-hover-dark"
                                            : "bg-brand-primary-light text-white hover:bg-brand-primary-hover-light"
                                            }`}
                                    >
                                        <MdPlayArrow size={18} />
                                        <span>Start Practice</span>
                                    </motion.button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
