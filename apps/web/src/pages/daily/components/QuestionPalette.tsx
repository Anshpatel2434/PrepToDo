import React from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import type { Question, QuestionAttempt, UUID } from "../../../types";
import {
    selectCurrentQuestionIndex,
    setCurrentQuestionIndex,
    selectViewMode,
    selectElapsedTime,
    goToNextQuestion,
    goToPreviousQuestion,
} from "../redux_usecase/dailyPracticeSlice";
import { MdCheck, MdFlag, MdChevronLeft, MdChevronRight } from "react-icons/md";

interface QuestionPaletteProps {
    questions: Question[];
    attempts: Record<UUID, Partial<QuestionAttempt>>;
    pendingAttempts?: Record<UUID, Partial<QuestionAttempt>>;
    isDark: boolean;
}

type ExamStatus = "answered" | "marked_for_review" | "not_visited";

type SolutionStatus = "correct" | "incorrect" | "unattempted";

const formatTime = (seconds?: number) => {
    if (seconds == null || Number.isNaN(seconds)) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const getCorrectAnswer = (question: Question) => {
    const ca = question.correct_answer as unknown;
    if (typeof ca === "object" && ca !== null && "answer" in ca) {
        return String((ca as { answer?: unknown }).answer ?? "");
    }
    return String(ca ?? "");
};

const getUserAnswer = (attempt?: Partial<QuestionAttempt>) => {
    const ua = attempt?.user_answer as unknown;
    if (typeof ua === "object" && ua !== null && "user_answer" in ua) {
        return (ua as { user_answer?: unknown }).user_answer;
    }
    return undefined;
};

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
    questions,
    attempts,
    pendingAttempts = {},
    isDark,
}) => {
    const dispatch = useDispatch();
    const currentIndex = useSelector(selectCurrentQuestionIndex);
    const viewMode = useSelector(selectViewMode);
    const elapsedTimeSeconds = useSelector(selectElapsedTime);

    const allAttempts = React.useMemo(
        () => ({ ...attempts, ...pendingAttempts }),
        [attempts, pendingAttempts]
    );

    const getAttemptForQuestion = React.useCallback(
        (questionId: UUID) => pendingAttempts[questionId] || attempts[questionId],
        [attempts, pendingAttempts]
    );

    const getExamStatus = React.useCallback(
        (attempt?: Partial<QuestionAttempt>): ExamStatus => {
            if (!attempt) return "not_visited";
            if (attempt.marked_for_review) return "marked_for_review";
            const userAnswer = getUserAnswer(attempt);
            const hasAnswer = userAnswer != null && String(userAnswer).length > 0;
            return hasAnswer ? "answered" : "not_visited";
        },
        []
    );

    const getSolutionStatus = React.useCallback(
        (question: Question, attempt?: Partial<QuestionAttempt>): SolutionStatus => {
            const userAnswer = getUserAnswer(attempt);
            const hasAnswer = userAnswer != null && String(userAnswer).length > 0;
            if (!attempt || !hasAnswer) return "unattempted";

            const correctAnswer = getCorrectAnswer(question);
            const isCorrect =
                typeof attempt.is_correct === "boolean"
                    ? attempt.is_correct
                    : String(userAnswer) === correctAnswer;

            return isCorrect ? "correct" : "incorrect";
        },
        []
    );

    const getStatusColor = (status: ExamStatus | SolutionStatus) => {
        switch (status) {
            case "answered":
                return isDark
                    ? "bg-success/80 border-success text-white"
                    : "bg-success border-success text-white";
            case "marked_for_review":
                return isDark
                    ? "bg-info/80 border-info text-white"
                    : "bg-info border-info text-white";
            case "correct":
                return isDark
                    ? "bg-success/80 border-success text-white"
                    : "bg-success border-success text-white";
            case "incorrect":
                return isDark
                    ? "bg-error/80 border-error text-white"
                    : "bg-error border-error text-white";
            case "unattempted":
            case "not_visited":
            default:
                return isDark
                    ? "bg-bg-tertiary-dark border-border-dark text-text-secondary-dark"
                    : "bg-bg-tertiary-light border-border-light text-text-secondary-light";
        }
    };

    const examStats = React.useMemo(
        () => ({
            answered: Object.values(allAttempts).filter((a) => {
                const userAnswer = getUserAnswer(a);
                const hasAnswer = userAnswer != null && String(userAnswer).length > 0;
                return hasAnswer && !a.marked_for_review;
            }).length,
            marked: Object.values(allAttempts).filter((a) => a.marked_for_review).length,
            notVisited: questions.length - Object.keys(allAttempts).length,
        }),
        [allAttempts, questions.length]
    );

    const gridRows = React.useMemo(
        () => Math.max(1, Math.ceil(questions.length / 5)),
        [questions.length]
    );

    const gridSizing = React.useMemo(() => {
        const buttonPx = 40; // 2.5rem
        const gapPx = 8; // gap-2
        const verticalPaddingPx = 32; // p-4 top + bottom
        const heightPx = gridRows * buttonPx + Math.max(0, gridRows - 1) * gapPx;
        return { buttonPx, gapPx, verticalPaddingPx, heightPx };
    }, [gridRows]);

    const timeStats = React.useMemo(() => {
        const times = Object.values(allAttempts)
            .map((a) => a.time_spent_seconds)
            .filter((t): t is number => typeof t === "number" && !Number.isNaN(t));
        const total = times.reduce((sum, t) => sum + t, 0);
        const avg = times.length > 0 ? Math.round(total / times.length) : 0;
        return { avgSeconds: avg, attemptedCount: times.length };
    }, [allAttempts]);

    const currentQuestion = questions[currentIndex];
    const currentAttempt = currentQuestion
        ? getAttemptForQuestion(currentQuestion.id)
        : undefined;

    const currentUserAnswer = getUserAnswer(currentAttempt);
    const currentCorrectAnswer = currentQuestion ? getCorrectAnswer(currentQuestion) : "";

    const isCurrentAnswered =
        currentUserAnswer != null && String(currentUserAnswer).length > 0;

    return (
        <motion.div
            className={`h-full w-full shrink-0 backdrop-blur-xl border-l shadow-xl flex flex-col ${
                isDark
                    ? "bg-bg-primary-dark/95 border-border-dark"
                    : "bg-bg-primary-light/95 border-border-light"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div
                className={`p-4 border-b ${
                    isDark ? "border-border-dark" : "border-border-light"
                }`}
            >
                <h3
                    className={`font-semibold text-sm uppercase tracking-wide ${
                        isDark ? "text-text-primary-dark" : "text-text-primary-light"
                    }`}
                >
                    Question Palette
                </h3>
                <div
                    className={`mt-2 text-xs ${
                        isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                    }`}
                >
                    {questions.length} Questions
                </div>
            </div>

            {/* Status Legend */}
            <div
                className={`p-4 border-b space-y-2 ${
                    isDark ? "border-border-dark" : "border-border-light"
                }`}
            >
                {viewMode === "exam" ? (
                    <>
                        <div className="flex items-center justify-between text-xs">
                            <span
                                className={
                                    isDark
                                        ? "text-text-secondary-dark"
                                        : "text-text-secondary-light"
                                }
                            >
                                Answered
                            </span>
                            <span className="font-medium text-success">
                                {examStats.answered}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span
                                className={
                                    isDark
                                        ? "text-text-secondary-dark"
                                        : "text-text-secondary-light"
                                }
                            >
                                Marked
                            </span>
                            <span className="font-medium text-info">{examStats.marked}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span
                                className={
                                    isDark
                                        ? "text-text-secondary-dark"
                                        : "text-text-secondary-light"
                                }
                            >
                                Not Visited
                            </span>
                            <span
                                className={`font-medium ${
                                    isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                }`}
                            >
                                {examStats.notVisited}
                            </span>
                        </div>
                    </>
                ) : (
                    <div
                        className={`space-y-2 text-xs ${
                            isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full bg-success" />
                            <span>Correct</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full bg-error" />
                            <span>Incorrect</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span
                                className={`inline-block w-3 h-3 rounded-full ${
                                    isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"
                                }`}
                            />
                            <span>Unattempted</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MdFlag className="opacity-80" size={14} />
                            <span>Marked for review</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Grid */}
            <div
                className="p-4 shrink-0"
                style={{ height: gridSizing.heightPx + gridSizing.verticalPaddingPx }}
            >
                <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, i) => {
                        const attempt = getAttemptForQuestion(q.id);
                        const isMarked = Boolean(attempt?.marked_for_review);
                        const userAnswer = getUserAnswer(attempt);
                        const hasAnswer = userAnswer != null && String(userAnswer).length > 0;

                        const status =
                            viewMode === "exam"
                                ? getExamStatus(attempt)
                                : getSolutionStatus(q, attempt);

                        return (
                            <motion.button
                                key={q.id}
                                onClick={() => dispatch(setCurrentQuestionIndex(i))}
                                className={`
                                    relative w-10 h-10 flex items-center justify-center rounded-full font-medium text-sm border-2
                                    ${getStatusColor(status)}
                                    ${
                                        currentIndex === i
                                            ? isDark
                                                ? "ring-2 ring-brand-primary-dark/60 shadow-md"
                                                : "ring-2 ring-brand-primary-light/60 shadow-md"
                                            : ""
                                    }
                                `}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.96 }}
                                aria-label={`Go to question ${i + 1}`}
                            >
                                <span className="leading-none">{i + 1}</span>

                                {/* Exam Mode: tick badge when marked + answered */}
                                {viewMode === "exam" && isMarked && hasAnswer && (
                                    <span
                                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow border ${
                                            isDark
                                                ? "bg-bg-primary-dark text-info border-info/40"
                                                : "bg-bg-primary-light text-info border-info/30"
                                        }`}
                                        title="Marked + answered"
                                    >
                                        <MdCheck size={12} />
                                    </span>
                                )}

                                {/* Solution Mode: show mark icon regardless of correctness */}
                                {viewMode === "solution" && isMarked && (
                                    <span
                                        className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow ${
                                            isDark
                                                ? "bg-bg-primary-dark text-warning"
                                                : "bg-bg-primary-light text-warning"
                                        }`}
                                        title="Marked for review"
                                    >
                                        <MdFlag size={12} />
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {viewMode === "solution" && (
                <div
                    className={`shrink-0 p-4 border-t space-y-2 ${
                        isDark ? "border-border-dark" : "border-border-light"
                    }`}
                >
                    <div
                        className={`text-xs font-semibold uppercase tracking-wide ${
                            isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}
                    >
                        Attempt Info
                    </div>

                    {currentQuestion ? (
                        <div
                            className={`text-xs space-y-1 ${
                                isDark
                                    ? "text-text-secondary-dark"
                                    : "text-text-secondary-light"
                            }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span className="opacity-70">Type</span>
                                <span className="font-medium">
                                    {currentQuestion.question_type.replace(/_/g, " ")}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="opacity-70">Difficulty</span>
                                <span className="font-medium">
                                    {currentQuestion.difficulty || "-"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="opacity-70">Your answer</span>
                                <span className="font-medium">
                                    {isCurrentAnswered ? String(currentUserAnswer) : "-"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="opacity-70">Correct answer</span>
                                <span className="font-medium text-success">
                                    {currentCorrectAnswer || "-"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="opacity-70">Your time</span>
                                <span className="font-medium">
                                    {formatTime(currentAttempt?.time_spent_seconds)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="opacity-70">Avg time</span>
                                <span className="font-medium">
                                    {timeStats.attemptedCount > 0
                                        ? formatTime(timeStats.avgSeconds)
                                        : "-"}
                                </span>
                            </div>
                            {typeof currentAttempt?.confidence_level === "number" && (
                                <div className="flex items-center justify-between gap-3">
                                    <span className="opacity-70">Confidence</span>
                                    <span className="font-medium">
                                        {currentAttempt.confidence_level}
                                    </span>
                                </div>
                            )}
                            <div className="pt-2 flex items-center justify-between gap-3">
                                <span className="opacity-70">Session time</span>
                                <span className="font-medium">
                                    {formatTime(elapsedTimeSeconds)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`text-xs ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                        >
                            No question selected.
                        </div>
                    )}
                </div>
            )}

            {/* Navigation Buttons in Solution Mode */}
            {viewMode === "solution" && (
                <div className={`mt-auto p-4 border-t flex justify-between gap-2 ${isDark ? "border-border-dark" : "border-border-light"}`}>
                    <button
                        onClick={() => dispatch(goToPreviousQuestion())}
                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isDark
                            ? "bg-bg-tertiary-dark text-text-primary-dark hover:bg-bg-primary-dark border border-border-dark"
                            : "bg-bg-tertiary-light text-text-primary-light hover:bg-bg-primary-light border border-border-light"
                            }`}
                    >
                        <MdChevronLeft className="w-4 h-4" />
                        Prev
                    </button>
                    <button
                        onClick={() => dispatch(goToNextQuestion())}
                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isDark
                            ? "bg-brand-primary-dark text-white hover:opacity-90"
                            : "bg-brand-primary-light text-white hover:opacity-90"
                            }`}
                    >
                        Next
                        <MdChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default QuestionPalette;
