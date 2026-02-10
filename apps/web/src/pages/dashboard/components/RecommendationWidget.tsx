import React from "react";
import { motion } from "framer-motion";
import { Lightbulb, Target, Shapes, List } from "lucide-react";
import type { UserProficiencySignals, UserMetricProficiency } from "../../../types";

interface RecommendationWidgetProps {
    signals: UserProficiencySignals | null | undefined;
    metricProficiency: UserMetricProficiency[];
    isLoading: boolean;
    isDark: boolean;
    index: number;
    className?: string;
    error?: unknown;
}

function PriorityItem({
    priority,
    label,
    description,
    type,
    isDark,
}: {
    priority: number;
    label: string;
    description: string;
    type: "topic" | "qtype" | "core";
    isDark: boolean;
}) {
    // Distinct styles for each position/type
    const styleConfig = {
        1: { // Red - Urgent
            bg: isDark ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-200",
            iconBg: isDark ? "bg-rose-500/20 text-rose-400" : "bg-rose-100 text-rose-600",
            text: isDark ? "text-rose-200" : "text-rose-800"
        },
        2: { // Amber - Warning
            bg: isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200",
            iconBg: isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600",
            text: isDark ? "text-amber-200" : "text-amber-800"
        },
        3: { // Blue - Improvement
            bg: isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200",
            iconBg: isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600",
            text: isDark ? "text-blue-200" : "text-blue-800"
        }
    };

    const config = styleConfig[priority as keyof typeof styleConfig];

    const Icon = type === 'topic' ? Shapes : type === 'qtype' ? List : Target;
    const typeLabel = type === 'topic' ? 'Weak Genre' : type === 'qtype' ? 'Question Type' : 'Core Metric';

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={`relative flex flex-col p-5 rounded-2xl border ${config.bg} h-full`}
        >
            {/* Header with Type and Rank */}
            <div className="flex items-center justify-between mb-4">
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.iconBg}`}>
                    {typeLabel}
                </div>
                <div className={`text-xs font-bold opacity-60 ${isDark ? "text-white" : "text-black"}`}>
                    #{priority}
                </div>
            </div>

            {/* Icon and Main Label */}
            <div className="flex items-start gap-3 mb-2">
                <div className={`p-2 rounded-xl shrink-0 ${config.iconBg}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <h4 className={`font-bold text-lg leading-tight mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                        {label}
                    </h4>
                </div>
            </div>

            {/* Description */}
            <p className={`text-xs leading-relaxed opacity-80 mt-auto ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                {description}
            </p>
        </motion.div>
    );
}

function getTopicDescription(topic: string): string {
    const descriptions: Record<string, string> = {
        "inference": "Practice drawing conclusions.",
        "tone_detection": "Identify attitude & undertones.",
        "main_idea": "Summarize central arguments.",
        "vocabulary_context": "Decode meaning from context.",
        "logical_reasoning": "Follow argument structures.",
        "critical_analysis": "Evaluate argument strength.",
    };
    const key = topic.toLowerCase().replace(/\s+/g, '_');
    return descriptions[key] || "Improve through targeted practice.";
}

function getQuestionTypeDescription(qType: string): string {
    const descriptions: Record<string, string> = {
        "para_summary": "Condense paragraphs effectively.",
        "para_completion": "Find logical conclusions.",
        "para_jumble": "Reorder sentences logically.",
        "odd_one_out": "Spot the thematic outlier.",
    };
    const key = qType.toLowerCase().replace(/\s+/g, '_');
    return descriptions[key] || "Dedicate time to this type.";
}

function getCoreMetricDescription(metricName: string): string {
    const descriptions: Record<string, string> = {
        "reading_comprehension": "Boost attention & retention.",
        "verbal_ability": "Refine grammar & vocab.",
        "critical_reasoning": "Evaluate arguments better.",
        "data_interpretation": "Extract chart insights.",
        "quantitative_aptitude": "Speed up formula use.",
    };
    const key = metricName.toLowerCase().replace(/\s+/g, '_');
    return descriptions[key] || "Boost your overall score.";
}

export const RecommendationWidget: React.FC<RecommendationWidgetProps> = ({
    signals,
    metricProficiency,
    isLoading,
    isDark,
    index,
    className = "",
    error,
}) => {
    const focusItems = React.useMemo(() => {
        const items: Array<{ label: string; description: string; type: "topic" | "qtype" | "core" }> = [];

        if (signals?.weak_topics && signals.weak_topics.length > 0) {
            items.push({
                label: signals.weak_topics[0],
                description: getTopicDescription(signals.weak_topics[0]),
                type: "topic",
            });
        }

        if (signals?.weak_question_types && signals.weak_question_types.length > 0) {
            items.push({
                label: signals.weak_question_types[0],
                description: getQuestionTypeDescription(signals.weak_question_types[0]),
                type: "qtype",
            });
        }

        const coreMetrics = metricProficiency.filter(m => m.dimension_type === 'core_metric');
        const weakestCore = coreMetrics.sort((a, b) => (a.proficiency_score ?? 100) - (b.proficiency_score ?? 100))[0];

        if (weakestCore) {
            items.push({
                label: weakestCore.dimension_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                description: getCoreMetricDescription(weakestCore.dimension_key),
                type: "core",
            });
        }

        return items.slice(0, 3);
    }, [signals, metricProficiency]);

    const hasData = !!(signals || (metricProficiency && metricProficiency.length > 0));
    const hasNoWeakAreas = hasData && focusItems.length === 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className={`rounded-3xl p-6 md:p-8 ${isDark ? "bg-bg-secondary-dark/5" : "bg-white/40"} backdrop-blur-xl border ${isDark ? "border-white/5" : "border-white/20"} ${className}`}
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-end gap-2">
                        <h3 className={`font-bold text-2xl sm:text-3xl flex items-center gap-3 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            <Target className={isDark ? "text-brand-primary-dark" : "text-brand-primary-light"} />
                            Focus Areas
                        </h3>
                        <span className={`text-md italic font-bold ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>(MAIN FEATURES COMING SOON)</span>
                    </div>
                    <p className={`text-lg mt-2 opacity-80 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        Your personalized path to improvement today.
                    </p>
                </div>
            </div>

            <div>
                {error ? (
                    <div className={`text-sm ${isDark ? "text-rose-300" : "text-rose-700"}`}>
                        Error loading recommendations.
                    </div>
                ) : isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse h-40 rounded-2xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                        ))}
                    </div>
                ) : !hasData ? (
                    <div className={`text-sm py-12 text-center ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        Complete a test to unlock insights.
                    </div>
                ) : hasNoWeakAreas ? (
                    <div className={`flex flex-col items-center justify-center py-12 text-center rounded-2xl ${isDark ? "bg-white/5" : "bg-white/50"}`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-brand-accent-dark/10 text-brand-accent-dark" : "bg-brand-accent-light/10 text-brand-accent-light"}`}>
                            <Lightbulb size={32} />
                        </div>
                        <div className="font-bold text-xl mb-1">All Systems Go!</div>
                        <div className="text-sm opacity-80">You're maintaining a great balance across all metrics.</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {focusItems.map((item, i) => (
                            <PriorityItem
                                key={`${item.type}-${item.label}`}
                                priority={i + 1}
                                label={item.label}
                                description={item.description}
                                type={item.type}
                                isDark={isDark}
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
