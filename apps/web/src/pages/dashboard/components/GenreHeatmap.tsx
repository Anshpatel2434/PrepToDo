import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { UserMetricProficiency } from "../../../types";

interface GenreHeatmapProps {
    genreProficiency: UserMetricProficiency[];
    isLoading: boolean;
    isDark: boolean;
}

interface GenreItem {
    genre: string;
    score: number;
    attempts: number;
    trend: "improving" | "declining" | "stagnant" | null;
}

const genreLabels: Record<string, string> = {
    "literary_passage": "Literary",
    "factual_passage": "Factual",
    "argumentative": "Argumentative",
    "narrative": "Narrative",
    "scientific": "Scientific",
    "social_science": "Social Science",
    "humanities": "Humanities",
    "business_economics": "Business",
    "environment": "Environment",
    "technology": "Technology",
    "arts_culture": "Arts & Culture",
    "philosophy": "Philosophy",
    "history": "History",
    "current_affairs": "Current Affairs",
};

const getGenreLabel = (key: string) => genreLabels[key] || key.replace(/_/g, " ");

const getHeatLevel = (score: number): 0 | 1 | 2 | 3 | 4 | 5 => {
    if (score >= 90) return 5;
    if (score >= 75) return 4;
    if (score >= 60) return 3;
    if (score >= 45) return 2;
    if (score >= 30) return 1;
    return 0;
};

const GenreHeatmap: React.FC<GenreHeatmapProps> = ({
    genreProficiency,
    isLoading,
    isDark,
}) => {
    const sortedGenres = useMemo((): GenreItem[] => {
        if (!genreProficiency || genreProficiency.length === 0) {
            // Generate dummy data for display
            return [
                { genre: "literary_passage", score: 72, attempts: 24, trend: "improving" as const },
                { genre: "argumentative", score: 68, attempts: 18, trend: "stagnant" as const },
                { genre: "factual_passage", score: 81, attempts: 32, trend: "improving" as const },
                { genre: "narrative", score: 65, attempts: 15, trend: "declining" as const },
                { genre: "scientific", score: 58, attempts: 22, trend: "stagnant" as const },
                { genre: "social_science", score: 70, attempts: 12, trend: "improving" as const },
            ];
        }
        return genreProficiency.map((g) => ({
            genre: g.dimension_key,
            score: g.proficiency_score,
            attempts: g.total_attempts,
            trend: g.trend ?? null,
        }));
    }, [genreProficiency]);

    const avgScore = useMemo(() => {
        if (sortedGenres.length === 0) return 0;
        const total = sortedGenres.reduce((sum, g) => sum + g.score, 0);
        return Math.round(total / sortedGenres.length);
    }, [sortedGenres]);

    const strongGenres = useMemo(() => 
        sortedGenres.filter((g) => g.score >= 70).length, 
    [sortedGenres]);
    
    const weakGenres = useMemo(() => 
        sortedGenres.filter((g) => g.score < 50).length, 
    [sortedGenres]);

    const trendIcons = {
        improving: "📈",
        declining: "📉",
        stagnant: "➡️",
        null: "",
    };

    const heatColorsLight = [
        "bg-gray-100",
        "bg-blue-200",
        "bg-blue-300",
        "bg-blue-400",
        "bg-blue-500",
        "bg-blue-600",
    ];

    const heatColorsDark = [
        "bg-gray-800",
        "bg-blue-900",
        "bg-blue-800",
        "bg-blue-700",
        "bg-blue-600",
        "bg-blue-500",
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
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.3 }}
        >
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <h2
                            className={`text-base sm:text-lg font-semibold tracking-tight ${
                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                        >
                            🗺️ Genre Proficiency
                        </h2>
                    </div>
                    <p
                        className={`text-sm ${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                    >
                        Performance across passage types
                    </p>
                </div>

                {/* Stats badges */}
                <div className="flex items-center gap-2">
                    <div
                        className={`rounded-xl px-2 py-1 text-center ${
                            isDark
                                ? "bg-green-900/30 border border-green-800"
                                : "bg-green-100 border border-green-200"
                        }`}
                    >
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Strong
                        </div>
                        <div className="text-sm font-bold text-green-700 dark:text-green-300">
                            {strongGenres}
                        </div>
                    </div>
                    <div
                        className={`rounded-xl px-2 py-1 text-center ${
                            isDark
                                ? "bg-red-900/30 border border-red-800"
                                : "bg-red-100 border border-red-200"
                        }`}
                    >
                        <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                            Needs Work
                        </div>
                        <div className="text-sm font-bold text-red-700 dark:text-red-300">
                            {weakGenres}
                        </div>
                    </div>
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
                    {/* Grid heatmap */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {sortedGenres.map((genre) => {
                            const heatLevel = getHeatLevel(genre.score);
                            return (
                                <motion.div
                                    key={genre.genre}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`relative rounded-xl p-3 border ${
                                        isDark
                                            ? `${heatColorsDark[heatLevel]} border-white/10`
                                            : `${heatColorsLight[heatLevel]} border-black/5`
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span
                                            className={`text-sm font-semibold truncate ${
                                                isDark ? "text-white" : "text-gray-900"
                                            }`}
                                        >
                                            {getGenreLabel(genre.genre)}
                                        </span>
                                        <span
                                            className={`text-lg ${
                                                isDark ? "text-white/80" : "text-gray-700"
                                            }`}
                                        >
                                            {trendIcons[genre.trend || "null"]}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <span
                                                className={`text-2xl font-bold ${
                                                    isDark ? "text-white" : "text-gray-900"
                                                }`}
                                            >
                                                {genre.score}%
                                            </span>
                                        </div>
                                        <div
                                            className={`text-xs ${
                                                isDark ? "text-white/60" : "text-gray-500"
                                            }`}
                                        >
                                            {genre.attempts} attempts
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div
                                        className={`mt-2 h-1.5 rounded-full overflow-hidden ${
                                            isDark ? "bg-white/20" : "bg-black/10"
                                        }`}
                                    >
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${genre.score}%` }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className={`h-full rounded-full ${
                                                isDark ? "bg-white" : "bg-gray-900"
                                            }`}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Empty state */}
                    {sortedGenres.length === 0 && (
                        <div
                            className={`flex flex-col items-center justify-center h-48 ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                        >
                            <span className="text-4xl mb-2">📚</span>
                            <span className="text-sm text-center">
                                Practice with different passage types to see your genre proficiency
                            </span>
                        </div>
                    )}

                    {/* Summary footer */}
                    <div
                        className={`mt-4 pt-4 border-t ${
                            isDark ? "border-border-dark" : "border-border-light"
                        }`}
                    >
                        <div className="flex items-center justify-between text-sm">
                            <span
                                className={
                                    isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                }
                            >
                                Average Genre Score
                            </span>
                            <span
                                className={`font-semibold ${
                                    isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                            >
                                {avgScore}%
                            </span>
                        </div>
                    </div>
                </>
            )}
        </motion.section>
    );
};

export default GenreHeatmap;
