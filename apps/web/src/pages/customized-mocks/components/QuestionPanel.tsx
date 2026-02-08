import React from "react";
import { motion } from "framer-motion";
import { Brain, Lightbulb, Target, AlertTriangle, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const correctAnswerRaw = question.correct_answer as any;
        const correctAnswerId = typeof correctAnswerRaw === 'object' ? correctAnswerRaw?.answer : correctAnswerRaw;
        const isCorrectOption = correctAnswerId === option.id;

        if (isExamMode) {
            return `w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${isSelected
                ? isDark
                    ? "bg-brand-primary-dark/20 border-brand-primary-dark text-text-primary-dark ring-2 ring-brand-accent-light"
                    : "bg-brand-primary-light/10 border-brand-primary-light text-text-primary-light ring-2 ring-brand-accent-light"
                : isDark
                    ? "bg-bg-tertiary-dark text-text-primary-dark border-border-dark hover:border-brand-primary-dark"
                    : "bg-bg-tertiary-light text-text-primary-light border-border-light hover:border-brand-primary-light"
                }`;
        }
        if (isCorrectOption)
            return `w-full p-4 rounded-xl border-2 text-left ${isDark
                ? "bg-success/20 border-success text-success"
                : "bg-success/10 border-success text-success"
                }`;
        if (isSelected && !isCorrectOption)
            return `w-full p-4 rounded-xl border-2 text-left ${isDark
                ? "bg-error/20 border-error text-error"
                : "bg-error/10 border-error text-error"
                }`;

        return `w-full p-4 rounded-xl border-2 text-left opacity-50 ${isDark
            ? "bg-bg-tertiary-dark text-text-primary-dark border-border-dark"
            : "bg-bg-tertiary-light text-text-primary-light border-border-light"
            }`;
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
                            Identifying reasoning patterns and gaps.
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

                {/* Technical Details (Collapsed) */}
                <details className="group">
                    <summary className={`list-none flex items-center gap-2 cursor-pointer text-sm font-medium opacity-60 hover:opacity-100 transition-opacity ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        <div className={`p-1 rounded transition-transform group-open:rotate-90`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                        View Technical Breakdown
                    </summary>
                    <div className="mt-6 space-y-6 pl-6 border-l border-dashed border-opacity-30 border-gray-400">
                        {diagnostic.trap_analysis && (
                            <div className="space-y-2">
                                <h6 className={`text-xs font-bold uppercase tracking-wider opacity-60 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>Trap Analysis</h6>
                                <p className={`text-sm leading-relaxed ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                    {diagnostic.trap_analysis}
                                </p>
                            </div>
                        )}

                        {diagnostic.dominant_reasoning_failures && diagnostic.dominant_reasoning_failures.length > 0 && (
                            <div className="space-y-3">
                                <h6 className={`text-xs font-bold uppercase tracking-wider opacity-60 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>Reasoning Gaps</h6>
                                <div className="space-y-2">
                                    {diagnostic.dominant_reasoning_failures?.map((f, i) => (
                                        <div key={i} className={`flex items-start gap-3 p-3 rounded-md ${isDark ? "bg-bg-tertiary-dark/50" : "bg-bg-tertiary-light/50"}`}>
                                            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-warning" : "text-warning"}`} />
                                            <div>
                                                <div className={`text-xs font-bold uppercase mb-0.5 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>{f.reasoning_node_label}</div>
                                                <div className={`text-xs opacity-80 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>{f.failure_description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {diagnostic.error_pattern_keys && diagnostic.error_pattern_keys.length > 0 && (
                            <div className="space-y-2">
                                <h6 className={`text-xs font-bold uppercase tracking-wider opacity-60 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>Identified Patterns</h6>
                                <div className="flex flex-wrap gap-2">
                                    {diagnostic.error_pattern_keys.map((key) => (
                                        <span key={key} className={`px-2 py-1 rounded-md text-xs font-medium ${isDark ? "bg-error/10 text-error" : "bg-error/10 text-error"}`}>
                                            {key.replace(/_/g, " ")}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </details>
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
                            <div className={`p-4 rounded-xl border ${isDark ? "bg-bg-tertiary-dark border-border-dark" : "bg-bg-tertiary-light border-border-light"}`}>
                                {getSentences(question).map((s) => (
                                    <div key={s.id} className={`p-3 mb-2 rounded-lg border flex gap-3 ${isDark ? "bg-bg-secondary-dark text-text-primary-dark border-border-dark" : "bg-bg-secondary-light text-text-primary-light border-border-light"}`}>
                                        <span className="font-mono font-bold opacity-50">{s.id}</span>
                                        <span className="whitespace-pre-line">{s.text}</span>
                                    </div>
                                ))}
                            </div>
                            {isExamMode ? (
                                <input
                                    type="text"
                                    value={displayUserAnswer}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase().slice(0, 4);
                                        onAnswerUpdate(val);
                                    }}
                                    placeholder="Enter Sequence (e.g. 2143)"
                                    className={`w-full p-4 rounded-xl border-2 text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary-light ${isDark ? "bg-bg-tertiary-dark text-text-primary-dark border-border-dark" : "bg-bg-tertiary-light text-text-primary-light border-border-light"}`}
                                />
                            ) : (
                                <div className={`p-4 rounded-xl border text-center font-mono text-lg ${isDark ? " text-text-primary-dark " : " text-text-primary-light "} `}>
                                    Your Answer: <span className={getCorrectAnswerText() === displayUserAnswer ? "text-success" : "text-error"}>{displayUserAnswer || "-"}</span><br />
                                    Correct: <span className="text-success">{getCorrectAnswerText()}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
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
                                    <div className="flex items-start gap-3">
                                        <span className="font-mono font-bold opacity-70">{opt.id}</span>
                                        <span className="flex-1 whitespace-pre-line">{opt.text}</span>
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
