import React from "react";
import { motion } from "framer-motion";
import { Brain, Lightbulb, Target, CheckCircle2, TrendingUp, Sparkles, Check, X } from "lucide-react";
import type { Option, Question } from "../../../types";
import { ConfidenceSelector } from "./ConfidenceSelector";
import type { SolutionViewType } from "./SolutionToggle";
import { SolutionToggle } from "./SolutionToggle";

// Define types locally if not exported from types.ts
interface DiagnosticData {
    analysis?: string;
    action?: string;
    performance?: string;
    focus_areas?: string[];

    // Deprecated fields
    personalized_analysis?: string;
    targeted_advice?: string;
    strength_comparison?: string;
    related_weak_areas?: Array<{ human_readable_description: string; proficiency_score: number }>;

    trap_analysis?: string;
    dominant_reasoning_failures?: Array<{ reasoning_node_label: string; failure_description: string }>;
    error_pattern_keys?: string[];
}

interface QuestionPanelProps {
    question: Question;
    isDark: boolean;
    viewMode: "exam" | "solution" | "practice";
    userAnswer?: string | string[];
    confidenceValue?: number;
    solutionViewType: SolutionViewType;
    onAnswerUpdate: (value: string) => void;
    onConfidenceUpdate: (value: number) => void;
    onSolutionViewTypeChange: (value: SolutionViewType) => void;
    aiInsights?: {
        isAnalysed: boolean;
        diagnostic?: DiagnosticData;
    };
    isCorrect?: boolean;
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({
    question,
    isDark,
    viewMode,
    userAnswer = "",
    confidenceValue = 0,
    solutionViewType,
    onAnswerUpdate,
    onConfidenceUpdate,
    onSolutionViewTypeChange,
    aiInsights,
    isCorrect: propIsCorrect,
}) => {
    const isExamMode = viewMode === "exam";
    const displayUserAnswer = typeof userAnswer === 'string' ? userAnswer : String(userAnswer || "");

    const transformOptions = (options: Record<string, string | { text: string }> | Array<string | { text: string }> | null | undefined): Option[] => {
        if (!options) return [];
        if (Array.isArray(options)) {
            return options.map((opt, i) => ({
                id: String.fromCharCode(65 + i),
                text: typeof opt === "string" ? opt : opt.text || String(opt),
            }));
        }
        return Object.entries(options).map(([k, v]) => ({
            id: k,
            text: typeof v === "string" ? v : (v as { text: string }).text || String(v),
        }));
    };

    const getSentences = (q: Question): Option[] => {
        if (!q.jumbled_sentences || typeof q.jumbled_sentences !== "object") return [];
        return Object.entries(q.jumbled_sentences as Record<string, string>).map(([k, v]) => ({
            id: k,
            text: v,
        })).slice(0, q.question_type === "para_jumble" ? 4 : undefined);
    };

    const getOptionClass = (option: Option) => {
        const isSelected = displayUserAnswer === option.id;

        if (isExamMode) {
            return `w-full py-3 px-2 text-left transition-all duration-200 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                }`;
        }
        // Solution Mode - no background, just text color
        return `w-full py-3 px-2 text-left ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
            } ${!isSelected ? "opacity-70" : ""}`;
    };

    const getOptionIndicator = (option: Option) => {
        const isSelected = displayUserAnswer === option.id;
        const correctAnswerRaw = question.correct_answer as Record<string, unknown>;
        const correctAnswerId = typeof correctAnswerRaw === 'object' ? correctAnswerRaw?.answer : correctAnswerRaw;
        const isCorrectOption = correctAnswerId === option.id;

        if (isExamMode) {
            // Show radio button in exam mode
            return (
                <div className={`w-5 h-5 rounded-full border-2 flex items-start justify-center flex-shrink-0 ${isSelected
                    ? isDark
                        ? "border-brand-primary-dark bg-brand-primary-dark"
                        : "border-brand-primary-light bg-brand-primary-light"
                    : isDark
                        ? "border-border-dark"
                        : "border-border-light"
                    }`}>
                </div>
            );
        }

        // Solution mode - show tick for correct, cross for incorrect selected
        if (isCorrectOption) {
            return <Check className="w-5 h-5 text-success flex-shrink-0" />;
        }
        if (isSelected && !isCorrectOption) {
            return <X className="w-5 h-5 text-error flex-shrink-0" />;
        }
        // Unselected wrong options - show empty radio
        return (
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${isDark ? "border-border-dark" : "border-border-light"
                }`} />
        );
    };

    const renderAIInsights = () => {
        if (propIsCorrect) {
            return (
                <div className={`p-8 text-center rounded-xl border border-dashed ${isDark ? "border-border-dark" : "border-border-light"}`}>
                    <div className="flex justify-center mb-3">
                        <CheckCircle2 className={`w-8 h-8 ${isDark ? "text-success/50" : "text-success/50"}`} />
                    </div>
                    <p className={`font-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                        Great job!
                    </p>
                    <p className={`text-sm mt-1 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        AI insights are generated for incorrect attempts to help you learn.
                    </p>
                </div>
            );
        }

        if (!aiInsights?.isAnalysed) {
            return (
                <div className="flex flex-col items-center justify-center p-12 space-y-6 opacity-70">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                        <Sparkles className={`w-8 h-8 ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`} />
                    </motion.div>
                    <div className="text-center space-y-2">
                        <p className={`font-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            Analyzing your response...
                        </p>
                        <p className={`text-xs ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            Identifying reasoning patterns and gaps. {`(Generally takes 2-3 minutes)`}
                        </p>
                    </div>
                </div>
            );
        }

        const diagnostic = aiInsights.diagnostic;
        if (!diagnostic) {
            return (
                <div className={`p-8 text-center rounded-xl border border-dashed ${isDark ? "border-border-dark" : "border-border-light"}`}>
                    <p className={`font-medium ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        No AI insights available for this attempt.
                    </p>
                </div>
            );
        }

        const analysis = diagnostic.analysis || diagnostic.personalized_analysis;
        const action = diagnostic.action || diagnostic.targeted_advice;
        const performance = diagnostic.performance || diagnostic.strength_comparison;
        const focusAreas = diagnostic.focus_areas || (diagnostic.related_weak_areas?.map(a => a.human_readable_description) || []);

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex items-center gap-2 opacity-60">
                    <Brain className={`w-4 h-4 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`} />
                    <h4 className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        AI Diagnostics
                    </h4>
                </div>

                {/* Main Analysis */}
                {analysis && (
                    <div className="space-y-3">
                        <h5 className={`font-semibold text-lg ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            Analysis
                        </h5>
                        <p className={`leading-relaxed text-[15px] ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            {analysis}
                        </p>
                    </div>
                )}

                {/* Actionable Advice - Minimalist Card */}
                {action && (
                    <div className={`p-5 rounded-lg border-l-2 ${isDark
                        ? "border-brand-accent-light bg-bg-tertiary-dark"
                        : "border-brand-accent-light bg-bg-tertiary-light"
                        }`}>
                        <div className="flex gap-4">
                            <Lightbulb className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? "text-brand-accent-light" : "text-brand-accent-light"}`} />
                            <div className="space-y-1">
                                <h5 className={`font-semibold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                    Recommended Action
                                </h5>
                                <p className={`text-sm leading-relaxed ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                    {action}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Comparison & Weak Areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {performance && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 opacity-70">
                                <TrendingUp className="w-4 h-4" />
                                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                    Performance
                                </span>
                            </div>
                            <p className={`text-sm leading-relaxed italic ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                "{performance}"
                            </p>
                        </div>
                    )}

                    {focusAreas && focusAreas.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 opacity-70">
                                <Target className="w-4 h-4" />
                                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                    Focus Areas
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {focusAreas.map((area, i) => (
                                    <span
                                        key={i}
                                        className={`px-2.5 py-1 rounded text-xs font-medium border ${isDark
                                            ? "bg-transparent border-border-dark text-text-secondary-dark"
                                            : "bg-transparent border-border-light text-text-secondary-light"
                                            }`}
                                    >
                                        {area}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className={`border-t ${isDark ? "border-border-dark" : "border-border-light"} opacity-30`} />
            </div>
        );
    };

    const getCorrectAnswerText = (): string => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = question.correct_answer as any;
        return typeof raw === 'object' ? raw.answer : raw;
    }

    return (
        <div className={`h-full flex flex-col ${isDark ? "scrollbar-dark" : "scrollbar-light"}`}>
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-6 space-y-6">
                    {!isExamMode &&
                        (<div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${isDark ? "bg-brand-primary-dark/30 text-brand-primary-dark" : "bg-brand-primary-light/20 text-brand-primary-light"}`}>
                                {question.question_type.replace(/_/g, " ")}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${question.difficulty === "easy" ? "bg-success/80" : question.difficulty === "medium" ? "bg-warning/80" : "bg-error/80"} ${isDark ? "bg-bg-tertiary-dark text-text-primary-dark" : "bg-bg-tertiary-light text-text-primary-light"}`}>
                                {question.difficulty || "Medium"}
                            </span>
                        </div>)}

                    <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`text-lg font-semibold whitespace-pre-line ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                        {question.question_text}
                    </motion.h3>

                    {question.question_type === "para_jumble" || question.question_type === "odd_one_out" ? (
                        <div className="space-y-4">
                            {/* Jumbled sentences without background */}
                            <div className="space-y-2">
                                {getSentences(question).map((s) => (
                                    <div key={s.id} className={`py-2 flex gap-3 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                        <span className="font-mono font-bold opacity-50">{s.id}</span>
                                        <span className="whitespace-pre-line">{s.text}</span>
                                    </div>
                                ))}
                            </div>
                            {isExamMode ? (
                                <div className="flex flex-col items-center gap-6">
                                    {/* Styled Underline Input Field */}
                                    <input
                                        type="text"
                                        value={displayUserAnswer}
                                        readOnly
                                        placeholder=""
                                        className={`w-40 py-2 text-center text-3xl font-mono tracking-[0.5em] bg-transparent border-b-2 focus:outline-none transition-colors ${isDark
                                            ? "text-text-primary-dark border-border-dark focus:border-brand-primary-dark"
                                            : "text-text-primary-light border-border-light focus:border-brand-primary-light"
                                            }`}
                                    />

                                    {/* Grid Logic Keypad */}
                                    <div className={`grid grid-cols-3 gap-3 p-4 rounded-2xl ${isDark ? "bg-bg-secondary-dark/50" : "bg-bg-secondary-light/50"
                                        }`}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => {
                                                    if (displayUserAnswer.length < 4) {
                                                        onAnswerUpdate(displayUserAnswer + String(num));
                                                    }
                                                }}
                                                className={`w-16 h-14 rounded-xl font-mono text-xl font-bold transition-all duration-150 hover:scale-105 active:scale-95 shadow-sm ${isDark
                                                    ? "bg-bg-tertiary-dark text-text-primary-dark hover:bg-bg-secondary-dark ring-1 ring-white/5"
                                                    : "bg-white text-text-primary-light hover:bg-gray-50 ring-1 ring-black/5"
                                                    }`}
                                            >
                                                {num}
                                            </button>
                                        ))}

                                        {/* Clear button */}
                                        <button
                                            type="button"
                                            onClick={() => onAnswerUpdate("")}
                                            className={`w-16 h-14 rounded-xl font-mono text-sm font-bold transition-all duration-150 hover:scale-105 active:scale-95 ${isDark
                                                ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                                                : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                                }`}
                                        >
                                            CLR
                                        </button>

                                        {/* 0 Button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (displayUserAnswer.length < 4) {
                                                    onAnswerUpdate(displayUserAnswer + "0");
                                                }
                                            }}
                                            className={`w-16 h-14 rounded-xl font-mono text-xl font-bold transition-all duration-150 hover:scale-105 active:scale-95 shadow-sm ${isDark
                                                ? "bg-bg-tertiary-dark text-text-primary-dark hover:bg-bg-secondary-dark ring-1 ring-white/5"
                                                : "bg-white text-text-primary-light hover:bg-gray-50 ring-1 ring-black/5"
                                                }`}
                                        >
                                            0
                                        </button>

                                        {/* Backspace button */}
                                        <button
                                            type="button"
                                            onClick={() => onAnswerUpdate(displayUserAnswer.slice(0, -1))}
                                            className={`w-16 h-14 rounded-xl font-mono text-lg font-bold transition-all duration-150 hover:scale-105 active:scale-95 flex items-center justify-center ${isDark
                                                ? "bg-bg-tertiary-dark text-text-secondary-dark hover:bg-bg-secondary-dark ring-1 ring-white/5"
                                                : "bg-white text-text-secondary-light hover:bg-gray-50 ring-1 ring-black/5"
                                                }`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={`p-4 rounded-xl border text-center font-mono text-lg ${isDark ? " text-text-primary-dark " : " text-text-primary-light "} `}>
                                    Your Answer: <span className={getCorrectAnswerText() === displayUserAnswer ? "text-success" : "text-error"}>{displayUserAnswer || "-"}</span><br />
                                    Correct: <span className="text-success">{getCorrectAnswerText()}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {transformOptions(question.options).map((opt, i) => (
                                <motion.button
                                    key={opt.id}
                                    onClick={() => onAnswerUpdate(opt.id)}
                                    className={getOptionClass(opt)}
                                    disabled={!isExamMode}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <div className="flex items-center justify-start gap-3">
                                        {getOptionIndicator(opt)}
                                        <span className="font-mono font-bold opacity-70">{opt.id}</span>
                                        <span className="flex-1 whitespace-pre-line text-left">{opt.text}</span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {isExamMode && (
                        <div className="pt-4">
                            <ConfidenceSelector value={confidenceValue} onChange={onConfidenceUpdate} isDark={isDark} />
                        </div>
                    )}

                    {!isExamMode && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-6 p-6 rounded-xl border ${isDark ? "bg-bg-secondary-dark text-text-secondary-dark border-border-dark" : "bg-bg-secondary-light text-text-secondary-light border-border-light"}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Solution</h4>
                                <SolutionToggle value={solutionViewType} onChange={onSolutionViewTypeChange} hasPersonalizedRationale={true} isDark={isDark} />
                            </div>
                            <div className="leading-relaxed opacity-90 whitespace-pre-line">
                                {solutionViewType === "personalized" ? renderAIInsights() : question.rationale}
                            </div>
                        </motion.div>
                    )}
                    <div className="h-20" />
                </div>
            </div>
        </div>
    );
};
