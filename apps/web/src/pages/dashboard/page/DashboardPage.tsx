import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../context/ThemeContext";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { DashboardHeader } from "../components/DashboardHeader";
import { SummaryCards } from "../components/SummaryCards";
import { ActivityHeatmap } from "../components/ActivityHeatmap";
import { ProgressChart } from "../components/ProgressChart";
import { StrengthWeakness } from "../components/StrengthWeakness";
import { NextSteps } from "../components/NextSteps";
import { SocialPreview } from "../components/SocialPreview";
import { DashboardSkeleton } from "../components/SkeletonLoader";
import type {
    LeaderboardEntry,
    PracticeSession,
    Question,
    QuestionAttempt,
    UserAnalytics,
    UserProfile,
} from "../../../types";

const USER_ID = "11111111-1111-4111-8111-111111111111";

const makeUuid = (seed: number) =>
    `00000000-0000-4000-8000-${seed.toString(16).padStart(12, "0")}`;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toYmd = (d: Date) => d.toISOString().slice(0, 10);

const addDays = (d: Date, days: number) => new Date(d.getTime() + days * MS_PER_DAY);

// NOTE: Dummy data only (typed). Replace with real backend data in v2.
const buildDummyUserProfile = (nowIso: string): UserProfile => ({
    id: USER_ID,
    username: "prep_student",
    display_name: "Aarav Sharma",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=60",
    subscription_tier: "pro",
    preferred_difficulty: "adaptive",
    theme: "auto",
    daily_goal_minutes: 45,
    show_on_leaderboard: true,
    created_at: nowIso,
    updated_at: nowIso,
});

const buildDummyAnalytics = (endDateUtc: Date): UserAnalytics[] => {
    const days = 12 * 7; // 12 weeks (LeetCode-style)

    let currentStreak = 0;
    let longestStreak = 0;

    return Array.from({ length: days }, (_, i) => {
        const date = addDays(endDateUtc, -(days - 1 - i));
        const dateYmd = toYmd(date);

        // Calm, believable study pattern: lighter on weekends, occasional gaps.
        const dayOfWeek = date.getUTCDay(); // 0=Sun
        const baseMinutes = dayOfWeek === 0 ? 0 : dayOfWeek === 6 ? 18 : 35;
        const minutes_practiced = Math.max(
            0,
            Math.round(baseMinutes + Math.sin(i / 5) * 12 + (i % 9 === 0 ? -25 : 0))
        );

        const questions_attempted = Math.max(0, Math.round(minutes_practiced / 4));
        const noise = (i % 7) - 3;
        const questions_correct = Math.max(
            0,
            Math.min(questions_attempted, Math.round(questions_attempted * 0.72 + noise * 0.6))
        );

        if (questions_attempted > 0) {
            currentStreak += 1;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 0;
        }

        const accuracy_percentage =
            questions_attempted === 0
                ? null
                : Math.round((questions_correct / questions_attempted) * 100);

        return {
            id: makeUuid(1000 + i),
            user_id: USER_ID,
            date: dateYmd,
            minutes_practiced,
            questions_attempted,
            questions_correct,
            accuracy_percentage,
            current_streak: currentStreak,
            longest_streak: longestStreak,
            total_points: 0,
            created_at: date.toISOString(),
            updated_at: date.toISOString(),
        };
    });
};

const buildDummySessions = (nowIso: string): PracticeSession[] => {
    const sessions: PracticeSession[] = [];

    for (let i = 0; i < 10; i += 1) {
        const time_spent_seconds = 20 * 60 + (i % 4) * 7 * 60;
        sessions.push({
            id: makeUuid(2000 + i),
            user_id: USER_ID,
            session_type: i % 3 === 0 ? "timed_test" : "practice",
            mode: i % 2 === 0 ? "tutor" : "test",
            passage_ids: null,
            question_ids: null,
            time_limit_seconds: i % 3 === 0 ? 30 * 60 : null,
            time_spent_seconds,
            status: "completed",
            score_percentage: i % 3 === 0 ? 72 + (i % 4) * 4 : null,
            points_earned: 0,
            created_at: nowIso,
            updated_at: nowIso,
        });
    }

    return sessions;
};

const buildDummyQuestions = (nowIso: string): Question[] => [
    {
        id: makeUuid(3001),
        passage_id: null,
        question_text: "What is the author implying in the final paragraph?",
        question_type: "inference",
        options: ["A", "B", "C", "D"],
        correct_answer: "C",
        rationale: "The final paragraph suggests a constraint rather than a conclusion.",
        difficulty: "medium",
        tags: ["inference", "rc"],
        created_at: nowIso,
        updated_at: nowIso,
    },
    {
        id: makeUuid(3002),
        passage_id: null,
        question_text: "Which word best describes the tone of the passage?",
        question_type: "tone",
        options: ["Skeptical", "Celebratory", "Neutral", "Ironic"],
        correct_answer: "Skeptical",
        rationale: "The author repeatedly qualifies claims and challenges assumptions.",
        difficulty: "medium",
        tags: ["tone", "rc"],
        created_at: nowIso,
        updated_at: nowIso,
    },
    {
        id: makeUuid(3003),
        passage_id: null,
        question_text: "The primary purpose of the passage is to…",
        question_type: "purpose",
        options: ["Explain", "Refute", "Compare", "Narrate"],
        correct_answer: "Compare",
        rationale: "The structure weighs two approaches and contrasts outcomes.",
        difficulty: "easy",
        tags: ["purpose", "rc"],
        created_at: nowIso,
        updated_at: nowIso,
    },
    {
        id: makeUuid(3004),
        passage_id: null,
        question_text: "According to the passage, which detail is true?",
        question_type: "detail",
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
        rationale: "The statement matches the second paragraph exactly.",
        difficulty: "easy",
        tags: ["detail", "rc"],
        created_at: nowIso,
        updated_at: nowIso,
    },
    {
        id: makeUuid(3005),
        passage_id: null,
        question_text: "In context, the word 'austere' most nearly means…",
        question_type: "vocab_in_context",
        options: ["Harsh", "Bright", "Common", "Playful"],
        correct_answer: "Harsh",
        rationale: "The surrounding clause suggests severity and lack of comfort.",
        difficulty: "medium",
        tags: ["vocab"],
        created_at: nowIso,
        updated_at: nowIso,
    },
];

const buildDummyAttempts = (
    nowIso: string,
    questions: Question[],
    sessions: PracticeSession[]
): QuestionAttempt[] => {
    const sessionId = sessions[0]?.id ?? makeUuid(2000);
    return Array.from({ length: 46 }, (_, i) => {
        const q = questions[i % questions.length];
        const isCorrect = (i + (q.question_type === "tone" ? 1 : 0)) % 4 !== 0;
        return {
            id: makeUuid(4000 + i),
            user_id: USER_ID,
            session_id: sessionId,
            question_id: q.id,
            passage_id: null,
            user_answer: isCorrect ? q.correct_answer : "X",
            is_correct: isCorrect,
            time_spent_seconds: 35 + (i % 5) * 18,
            confidence_level: (i % 5) + 1,
            rationale_viewed: i % 3 === 0,
            ai_feedback: null,
            created_at: nowIso,
        };
    });
};

const buildDummyLeaderboard = (nowIso: string): LeaderboardEntry[] => [
    {
        id: makeUuid(5001),
        leaderboard_type: "daily",
        user_id: makeUuid(9001),
        rank: 3,
        score: 68,
        accuracy_percentage: 74,
        created_at: nowIso,
    },
    {
        id: makeUuid(5002),
        leaderboard_type: "daily",
        user_id: makeUuid(9002),
        rank: 4,
        score: 61,
        accuracy_percentage: 71,
        created_at: nowIso,
    },
    {
        id: makeUuid(5003),
        leaderboard_type: "daily",
        user_id: makeUuid(9003),
        rank: 5,
        score: 55,
        accuracy_percentage: 69,
        created_at: nowIso,
    },
];

const formatQuestionTypeLabel = (t: Question["question_type"]) => {
    switch (t) {
        case "vocab_in_context":
            return "Vocab in context";
        case "true_false":
            return "True/False";
        case "fill_in_blank":
            return "Fill in the blank";
        case "critical_reasoning":
            return "Critical reasoning";
        case "para_jumble":
            return "Para jumble";
        case "para_summary":
            return "Para summary";
        case "short_answer":
            return "Short answer";
        case "mcq":
            return "MCQ";
        default:
            return t.charAt(0).toUpperCase() + t.slice(1);
    }
};

const computeQuestionTypeAccuracy = (
    attempts: QuestionAttempt[],
    questions: Question[]
) => {
    const questionTypeById = new Map<string, Question["question_type"]>();
    for (const q of questions) questionTypeById.set(q.id, q.question_type);

    const totals = new Map<Question["question_type"], { correct: number; total: number }>();

    for (const a of attempts) {
        const qt = questionTypeById.get(a.question_id);
        if (!qt) continue;

        const prev = totals.get(qt) ?? { correct: 0, total: 0 };
        totals.set(qt, {
            correct: prev.correct + (a.is_correct ? 1 : 0),
            total: prev.total + 1,
        });
    }

    return Array.from(totals.entries())
        .map(([questionType, agg]) => ({
            questionType,
            label: formatQuestionTypeLabel(questionType),
            attempts: agg.total,
            correct: agg.correct,
            accuracy: agg.total === 0 ? 0 : Math.round((agg.correct / agg.total) * 100),
        }))
        .sort((a, b) => b.accuracy - a.accuracy);
};

export const DashboardPage: React.FC = () => {
    const { isDark } = useTheme();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate initial data loading with 1.5s controlled delay
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const nowIso = useMemo(() => new Date().toISOString(), []);
    const endDateUtc = useMemo(() => {
        const now = new Date();
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }, []);

    const userProfile = useMemo(() => buildDummyUserProfile(nowIso), [nowIso]);
    const analytics = useMemo(() => buildDummyAnalytics(endDateUtc), [endDateUtc]);
    const sessions = useMemo(() => buildDummySessions(nowIso), [nowIso]);
    const questions = useMemo(() => buildDummyQuestions(nowIso), [nowIso]);
    const attempts = useMemo(
        () => buildDummyAttempts(nowIso, questions, sessions),
        [nowIso, questions, sessions]
    );
    const leaderboard = useMemo(() => buildDummyLeaderboard(nowIso), [nowIso]);

    const questionTypePerformance = useMemo(
        () => computeQuestionTypeAccuracy(attempts, questions),
        [attempts, questions]
    );

    return (
        <div
            className={`min-h-screen ${
                isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
            }`}
        >
            <FloatingThemeToggle />
            <FloatingNavigation />

            <AnimatePresence mode="wait">
                {isLoading ? (
                    <DashboardSkeleton key="skeleton" />
                ) : (
                    <motion.main
                        key="content"
                        className="pt-24 pb-10 px-4 sm:px-6 lg:px-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div className="mx-auto max-w-7xl space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: 0.1 }}
                            >
                                <DashboardHeader userProfile={userProfile} isDark={isDark} />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: 0.2 }}
                            >
                                <SummaryCards analytics={analytics} sessions={sessions} isDark={isDark} />
                            </motion.div>

                            <motion.div
                                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: 0.3 }}
                            >
                                <div className="lg:col-span-5">
                                    <ActivityHeatmap analytics={analytics} isDark={isDark} weeks={12} />
                                </div>
                                <div className="lg:col-span-7">
                                    <ProgressChart analytics={analytics} isDark={isDark} />
                                </div>
                            </motion.div>

                            <motion.div
                                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: 0.4 }}
                            >
                                <div className="lg:col-span-7">
                                    <StrengthWeakness performance={questionTypePerformance} isDark={isDark} />
                                </div>
                                <div className="lg:col-span-5 space-y-6">
                                    <NextSteps performance={questionTypePerformance} isDark={isDark} />
                                    <SocialPreview leaderboard={leaderboard} isDark={isDark} />
                                </div>
                            </motion.div>
                        </div>
                    </motion.main>
                )}
            </AnimatePresence>
        </div>
    );
};
