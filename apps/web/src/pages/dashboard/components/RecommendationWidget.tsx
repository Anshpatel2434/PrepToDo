import React from "react";
import { motion } from "framer-motion";
import { MdAutoAwesome, MdTrendingUp, MdToday } from "react-icons/md";
import type { UserProficiencySignals } from "../../../types";

interface RecommendationWidgetProps {
    signals: UserProficiencySignals | null | undefined;
    isLoading: boolean;
    isDark: boolean;
    index: number;
    className?: string;
    error?: unknown;
}

function Chip({ label, isDark, priority }: { label: string; isDark: boolean; priority?: 'high' | 'medium' | 'low' }) {
    const priorityColors = {
        high: isDark ? "bg-rose-900/30 border-rose-700/50 text-rose-300" : "bg-rose-100 border-rose-300 text-rose-700",
        medium: isDark ? "bg-amber-900/30 border-amber-700/50 text-amber-300" : "bg-amber-100 border-amber-300 text-amber-700",
        low: isDark ? "bg-bg-tertiary-dark border-border-dark text-text-secondary-dark" : "bg-bg-tertiary-light border-border-light text-text-secondary-light"
    };

    const colorClass = priority ? priorityColors[priority] : (isDark ? "bg-bg-tertiary-dark border-border-dark text-text-secondary-dark" : "bg-bg-tertiary-light border-border-light text-text-secondary-light");

    return (
        <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105 ${colorClass
                }`}
        >
            {label}
        </span>
    );
}

export const RecommendationWidget: React.FC<RecommendationWidgetProps> = ({
    signals,
    isLoading,
    isDark,
    index,
    className = "",
    error,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.01 }}
            className={`rounded-2xl border p-6 overflow-hidden transition-all duration-300 shadow-lg ${isDark
                    ? "bg-bg-secondary-dark border-border-dark hover:border-brand-primary-dark/40 hover:shadow-brand-primary-dark/10"
                    : "bg-bg-secondary-light border-border-light hover:border-brand-primary-light/40 hover:shadow-brand-primary-light/10"
                } ${className}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3
                        className={`font-serif font-bold text-xl flex items-center gap-2 ${isDark
                                ? "text-text-primary-dark"
                                : "text-text-primary-light"
                            }`}
                    >
                        <MdAutoAwesome
                            className={
                                isDark
                                    ? "text-brand-primary-dark"
                                    : "text-brand-primary-light"
                            }
                        />
                        What To Do Next
                    </h3>
                    <p
                        className={`text-sm mt-1 ${isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                            }`}
                    >
                        Personalized practice focus based on your recent performance.
                    </p>
                </div>

                <div
                    className={`shrink-0 p-3 rounded-xl border ${isDark
                            ? "bg-bg-tertiary-dark border-border-dark"
                            : "bg-bg-tertiary-light border-border-light"
                        }`}
                >
                    <MdTrendingUp
                        className={
                            isDark
                                ? "text-brand-primary-dark"
                                : "text-brand-primary-light"
                        }
                        size={22}
                    />
                </div>
            </div>

            <div className="mt-6 space-y-4">
                {error ? (
                    <div
                        className={`text-sm ${isDark ? "text-rose-300" : "text-rose-700"
                            }`}
                    >
                        Error loading recommendations.
                    </div>
                ) : isLoading ? (
                    <div className="space-y-3">
                        <div className="animate-pulse h-4 w-40 rounded bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                        <div className="animate-pulse h-10 w-full rounded-xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                        <div className="animate-pulse h-10 w-5/6 rounded-xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60" />
                    </div>
                ) : !signals ? (
                    <div
                        className={`text-sm ${isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                            }`}
                    >
                        No recommendations yet. Complete a few practice sessions to
                        unlock personalized guidance.
                    </div>
                ) : (
                    <>
                        <div>
                            <div
                                className={`text-xs uppercase tracking-widest font-semibold mb-3 ${isDark
                                        ? "text-text-muted-dark"
                                        : "text-text-muted-light"
                                    }`}
                            >
                                Weak Topics
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(signals.weak_topics ?? []).length > 0 ? (
                                    (signals.weak_topics ?? [])
                                        .slice(0, 6)
                                        .map((t, idx) => (
                                            <Chip
                                                key={t}
                                                label={t}
                                                isDark={isDark}
                                                priority={idx < 2 ? 'high' : idx < 4 ? 'medium' : 'low'}
                                            />
                                        ))
                                ) : (
                                    <span
                                        className={`text-sm ${isDark
                                                ? "text-text-secondary-dark"
                                                : "text-text-secondary-light"
                                            }`}
                                    >
                                        Looks balanced — no weak topics flagged.
                                    </span>
                                )}
                            </div>
                        </div>

                        <div>
                            <div
                                className={`text-xs uppercase tracking-widest font-semibold mb-3 ${isDark
                                        ? "text-text-muted-dark"
                                        : "text-text-muted-light"
                                    }`}
                            >
                                Weak Question Types
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(signals.weak_question_types ?? []).length > 0 ? (
                                    (signals.weak_question_types ?? [])
                                        .slice(0, 6)
                                        .map((t, idx) => (
                                            <Chip
                                                key={t}
                                                label={t}
                                                isDark={isDark}
                                                priority={idx < 2 ? 'high' : idx < 4 ? 'medium' : 'low'}
                                            />
                                        ))
                                ) : (
                                    <span
                                        className={`text-sm ${isDark
                                                ? "text-text-secondary-dark"
                                                : "text-text-secondary-light"
                                            }`}
                                    >
                                        No weak question types flagged.
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${isDark
                                ? "bg-gradient-to-r from-brand-primary-dark/10 to-brand-accent-dark/10 border-brand-primary-dark/30"
                                : "bg-gradient-to-r from-brand-primary-light/10 to-brand-accent-light/10 border-brand-primary-light/30"
                            }`}>
                            <div>
                                <div
                                    className={`text-xs uppercase tracking-widest font-semibold mb-1 ${isDark
                                            ? "text-text-muted-dark"
                                            : "text-text-muted-light"
                                        }`}
                                >
                                    Recommended Difficulty
                                </div>
                                <div
                                    className={`text-lg font-bold ${isDark
                                            ? "text-text-primary-dark"
                                            : "text-text-primary-light"
                                        }`}
                                >
                                    {signals.recommended_difficulty ?? "adaptive"}
                                </div>
                            </div>

                            <button
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 ${isDark
                                        ? "bg-brand-primary-dark text-white hover:bg-brand-primary-hover-dark"
                                        : "bg-brand-primary-light text-white hover:bg-brand-primary-hover-light"
                                    }`}
                            >
                                <MdToday size={18} />
                                <span>Try Daily Practice</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
};
