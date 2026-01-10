import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { UserProficiencySignals, UserMetricProficiency } from "../../../types";

interface WhatToDoNextProps {
    proficiencySignals: UserProficiencySignals | null;
    coreMetrics: UserMetricProficiency[];
    genreProficiency: UserMetricProficiency[];
    isLoading: boolean;
    isDark: boolean;
}

interface Recommendation {
    id: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    type: "practice" | "review" | "focus" | "rest";
    estimatedTime: string;
    actionUrl?: string;
}

const getPriorityColor = (priority: string, isDark: boolean): string => {
    switch (priority) {
        case "high":
            return isDark ? "bg-red-900/50 border-red-700 text-red-200" : "bg-red-100 border-red-300 text-red-800";
        case "medium":
            return isDark ? "bg-yellow-900/50 border-yellow-700 text-yellow-200" : "bg-yellow-100 border-yellow-300 text-yellow-800";
        case "low":
            return isDark ? "bg-green-900/50 border-green-700 text-green-200" : "bg-green-100 border-green-300 text-green-800";
        default:
            return isDark ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-gray-100 border-gray-300 text-gray-800";
    }
};

const getTypeIcon = (type: string): string => {
    switch (type) {
        case "practice":
            return "🎯";
        case "review":
            return "📚";
        case "focus":
            return "🎯";
        case "rest":
            return "😴";
        default:
            return "📌";
    }
};

const WhatToDoNext: React.FC<WhatToDoNextProps> = ({
    proficiencySignals,
    coreMetrics,
    genreProficiency,
    isLoading,
    isDark,
}) => {
    const recommendations = useMemo((): Recommendation[] => {
        const recs: Recommendation[] = [];

        // Analyze weak areas from signals
        const weakTopics = proficiencySignals?.weak_topics || [];
        const weakQuestionTypes = proficiencySignals?.weak_question_types || [];

        // Generate recommendations based on weak areas
        if (weakTopics.length > 0) {
            weakTopics.slice(0, 2).forEach((topic) => {
                recs.push({
                    id: `topic-${topic}`,
                    title: `Focus on ${topic.replace(/_/g, " ")}`,
                    description: `Your proficiency in this topic is below average. Practice targeted questions to improve.`,
                    priority: "high",
                    type: "practice",
                    estimatedTime: "15-20 min",
                });
            });
        }

        if (weakQuestionTypes.length > 0) {
            weakQuestionTypes.slice(0, 2).forEach((qt) => {
                recs.push({
                    id: `qtype-${qt}`,
                    title: `Practice ${qt.replace(/_/g, " ")} questions`,
                    description: `You're making more errors on this question type. Review fundamentals and practice examples.`,
                    priority: "medium",
                    type: "review",
                    estimatedTime: "10-15 min",
                });
            });
        }

        // Add genre-based recommendations
        const weakGenres = genreProficiency
            .filter((g) => g.proficiency_score < 50)
            .sort((a, b) => a.proficiency_score - b.proficiency_score);

        if (weakGenres.length > 0) {
            recs.push({
                id: `genre-${weakGenres[0].dimension_key}`,
                title: `Strengthen ${weakGenres[0].dimension_key.replace(/_/g, " ")} passages`,
                description: `Your accuracy on this genre needs improvement. Read and practice more passages of this type.`,
                priority: "medium",
                type: "focus",
                estimatedTime: "20 min",
            });
        }

        // Add skill-based recommendations
        const weakSkills = coreMetrics
            .filter((m) => m.proficiency_score < 50)
            .sort((a, b) => a.proficiency_score - b.proficiency_score);

        if (weakSkills.length > 0) {
            recs.push({
                id: `skill-${weakSkills[0].dimension_key}`,
                title: `Improve ${weakSkills[0].dimension_key.replace(/_/g, " ")} skill`,
                description: `Focus on techniques to better handle this core skill. Try timed practice with feedback.`,
                priority: weakSkills[0].proficiency_score < 40 ? "high" : "medium",
                type: "practice",
                estimatedTime: "15 min",
            });
        }

        // Add a daily routine recommendation
        recs.push({
            id: "daily-routine",
            title: "Daily RC Practice (15 min)",
            description: "Read one untimed passage and summarize the author's claim and tone in two sentences.",
            priority: "low",
            type: "practice",
            estimatedTime: "15 min",
        });

        // Add rest recommendation if streak is high
        recs.push({
            id: "rest-reminder",
            title: "Take a breather",
            description: "You've been practicing consistently. Consider a lighter session or review day today.",
            priority: "low",
            type: "rest",
            estimatedTime: "Optional",
        });

        return recs.slice(0, 5);
    }, [proficiencySignals, coreMetrics, genreProficiency]);

    // Fallback dummy recommendations when no data
    const displayRecommendations = recommendations.length > 0 ? recommendations : [
        {
            id: "dummy-1",
            title: "Practice Inference Questions",
            description: "Focus on drawing conclusions from passage content. Look for author hints and evidence.",
            priority: "high" as const,
            type: "practice" as const,
            estimatedTime: "15-20 min",
        },
        {
            id: "dummy-2",
            title: "Review Tone Analysis",
            description: "Practice identifying author's attitude and tone. Watch for qualifiers and word choices.",
            priority: "medium" as const,
            type: "review" as const,
            estimatedTime: "10-15 min",
        },
        {
            id: "dummy-3",
            title: "Daily RC Routine",
            description: "Read one passage untimed. Summarize the main argument and author's tone.",
            priority: "low" as const,
            type: "practice" as const,
            estimatedTime: "15 min",
        },
    ];

    return (
        <motion.section
            className={`rounded-2xl border ${
                isDark
                    ? "bg-bg-secondary-dark border-border-dark"
                    : "bg-bg-secondary-light border-border-light"
            } p-5`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.45 }}
        >
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <h2
                            className={`text-base sm:text-lg font-semibold tracking-tight ${
                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                        >
                            🚀 What To Do Next
                        </h2>
                        <span
                            className={`text-xs px-2 py-1 rounded-lg border ${
                                isDark
                                    ? "border-border-dark bg-brand-primary-dark/20 text-brand-primary-dark"
                                    : "border-border-light bg-brand-primary-light/20 text-brand-primary-light"
                            }`}
                        >
                            Personalized
                        </span>
                    </div>
                    <p
                        className={`text-sm ${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                    >
                        AI-powered recommendations based on your performance
                    </p>
                </div>

                {/* Development badge */}
                <div
                    className={`rounded-xl px-2 py-1 text-xs font-medium ${
                        isDark
                            ? "bg-orange-900/30 border border-orange-800 text-orange-300"
                            : "bg-orange-100 border border-orange-200 text-orange-700"
                    }`}
                >
                    Developing
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-48">
                    <div
                        className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                            isDark ? "border-brand-primary-dark" : "border-brand-primary-light"
                        }`}
                    />
                </div>
            ) : (
                <>
                    {/* Priority filter chips */}
                    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                        <span
                            className={`text-xs font-medium ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                        >
                            Priority:
                        </span>
                        {["high", "medium", "low"].map((priority) => (
                            <button
                                key={priority}
                                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                    isDark
                                        ? "bg-bg-tertiary-dark border-border-dark hover:bg-bg-tertiary-dark/80"
                                        : "bg-bg-tertiary-light border-border-light hover:bg-bg-tertiary-light/80"
                                }`}
                            >
                                {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Recommendations list */}
                    <ul className="space-y-3">
                        {displayRecommendations.map((rec, index) => (
                            <motion.li
                                key={rec.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`rounded-xl border p-4 ${getPriorityColor(rec.priority, isDark)}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{getTypeIcon(rec.type)}</span>
                                            <h3
                                                className={`text-sm font-semibold ${
                                                    isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                                }`}
                                            >
                                                {rec.title}
                                            </h3>
                                        </div>
                                        <p
                                            className={`text-xs ${
                                                isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                            }`}
                                        >
                                            {rec.description}
                                        </p>
                                    </div>
                                    <div
                                        className={`text-xs px-2 py-1 rounded-lg whitespace-nowrap ${
                                            isDark
                                                ? "bg-bg-tertiary-dark/60 text-text-muted-dark"
                                                : "bg-bg-tertiary-light/60 text-text-muted-light"
                                        }`}
                                    >
                                        {rec.estimatedTime}
                                    </div>
                                </div>

                                {/* Action button */}
                                <div className="mt-3 flex items-center justify-end">
                                    <button
                                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                            isDark
                                                ? "bg-brand-primary-dark/20 text-brand-primary-dark hover:bg-brand-primary-dark/30"
                                                : "bg-brand-primary-light/20 text-brand-primary-light hover:bg-brand-primary-light/30"
                                        }`}
                                    >
                                        Start Now →
                                    </button>
                                </div>
                            </motion.li>
                        ))}
                    </ul>

                    {/* Footer */}
                    <div
                        className={`mt-4 pt-4 border-t ${
                            isDark ? "border-border-dark" : "border-border-light"
                        }`}
                    >
                        <div className="flex items-center justify-between text-xs">
                            <span
                                className={
                                    isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                }
                            >
                                Recommendations update after each session
                            </span>
                            <button
                                className={`font-medium transition-colors ${
                                    isDark
                                        ? "text-brand-primary-dark hover:text-brand-primary-dark/80"
                                        : "text-brand-primary-light hover:text-brand-primary-light/80"
                                }`}
                            >
                                View All →
                            </button>
                        </div>
                    </div>
                </>
            )}
        </motion.section>
    );
};

export default WhatToDoNext;
