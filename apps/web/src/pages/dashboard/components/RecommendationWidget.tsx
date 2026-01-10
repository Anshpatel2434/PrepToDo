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

function Chip({ label, isDark }: { label: string; isDark: boolean }) {
    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                isDark
                    ? "bg-bg-tertiary-dark border-border-dark text-text-secondary-dark"
                    : "bg-bg-tertiary-light border-border-light text-text-secondary-light"
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
            whileHover={{ scale: 1.02 }}
            className={`rounded-2xl border p-6 overflow-hidden transition-colors ${
                isDark
                    ? "bg-bg-secondary-dark border-border-dark hover:border-zinc-700"
                    : "bg-bg-secondary-light border-border-light hover:border-zinc-300"
            } ${className}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3
                        className={`font-serif font-bold text-xl flex items-center gap-2 ${
                            isDark
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
                        className={`text-sm mt-1 ${
                            isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                        }`}
                    >
                        Personalized practice focus based on your recent performance.
                    </p>
                </div>

                <div
                    className={`shrink-0 p-3 rounded-xl border ${
                        isDark
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
                        className={`text-sm ${
                            isDark ? "text-rose-300" : "text-rose-700"
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
                        className={`text-sm ${
                            isDark
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
                                className={`text-xs uppercase tracking-widest font-semibold mb-2 ${
                                    isDark
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
                                        .map((t) => (
                                            <Chip key={t} label={t} isDark={isDark} />
                                        ))
                                ) : (
                                    <span
                                        className={`text-sm ${
                                            isDark
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
                                className={`text-xs uppercase tracking-widest font-semibold mb-2 ${
                                    isDark
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
                                        .map((t) => (
                                            <Chip key={t} label={t} isDark={isDark} />
                                        ))
                                ) : (
                                    <span
                                        className={`text-sm ${
                                            isDark
                                                ? "text-text-secondary-dark"
                                                : "text-text-secondary-light"
                                        }`}
                                    >
                                        No weak question types flagged.
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div
                                    className={`text-xs uppercase tracking-widest font-semibold ${
                                        isDark
                                            ? "text-text-muted-dark"
                                            : "text-text-muted-light"
                                    }`}
                                >
                                    Recommended Difficulty
                                </div>
                                <div
                                    className={`mt-1 text-base font-semibold ${
                                        isDark
                                            ? "text-text-primary-dark"
                                            : "text-text-primary-light"
                                    }`}
                                >
                                    {signals.recommended_difficulty ?? "adaptive"}
                                </div>
                            </div>

                            <div
                                className={`flex items-center gap-2 text-sm font-medium ${
                                    isDark
                                        ? "text-brand-primary-dark"
                                        : "text-brand-primary-light"
                                }`}
                            >
                                <MdToday />
                                <span>Try Daily Practice</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
};
