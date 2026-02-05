import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useTheme } from "../../../context/ThemeContext";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { PageLoader } from "../../../ui_components/PageLoader";
import { CalendarCheck } from "lucide-react";
import type { Exam } from "../../../types";
import { useFetchDailyTestDataQuery, useFetchDailyTestByIdQuery, useFetchArticlesByIdsQuery } from "../redux_usecase/dailyPracticeApi";
import PreviousTestsContainer from "../components/PreviousTestsContainer";
import DailyLeaderboard from "../components/DailyLeaderboard";
import { DailyFeatureWidget } from "../components/DailyFeatureWidget";
import { ArticleSourceWidget } from "../components/ArticleSourceWidget";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const TOGGLE_OPTIONS = [
    { label: 'Practice', value: 'test' },
    { label: 'Leaderboard', value: 'leaderboard' },
] as const;

const DailyPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isDark } = useTheme();
    const [viewMode, setViewMode] = useState<"test" | "leaderboard">("test");

    // Fetch today's daily test data
    const { data: todayData, isLoading: isLoadingToday } = useFetchDailyTestDataQuery();

    // Check if there's a test for today
    const hasTodayTest = !!todayData?.examInfo;

    // Compute selected exam ID from URL params or default to today's exam
    const urlExamId = searchParams.get('exam_id');
    const selectedExamId = urlExamId || todayData?.examInfo?.id || null;

    // Check if the selected exam is today's exam
    const isSelectedToday = !!(todayData?.examInfo && selectedExamId === todayData.examInfo.id);

    // Fetch specific exam details if it's not today's exam
    const { data: selectedTestData } = useFetchDailyTestByIdQuery(
        { exam_id: selectedExamId! },
        { skip: !selectedExamId || isSelectedToday }
    );

    // Derive the selected exam object
    const selectedExam = isSelectedToday ? todayData?.examInfo : selectedTestData?.examInfo;

    const handleStartPractice = async (type: "rc" | "va") => {
        if (!selectedExamId) {
            console.error("No exam_id selected");
            return;
        }
        console.log("[DailyPage] handleStartPractice called for type:", type);
        navigate(`/daily/${type}?exam_id=${selectedExamId}`);
    };



    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isTodayExam = (exam: Exam) => {
        if (!todayData?.examInfo) return false;

        // Compare both exam ID and date to ensure it's actually today's exam
        const today = new Date().toISOString().split('T')[0];
        const examDate = new Date(exam.created_at).toISOString().split('T')[0];

        return todayData.examInfo.id === exam.id && examDate === today;
    };

    // Handle exam selection with toast notification for previous exams
    const handleExamSelect = (examId: string, examDate: string) => {
        // Force a page refresh to ensure proper rendering with the new exam_id
        window.location.href = `/daily?exam_id=${examId}`;

        // Show toast for previous exams (not today's)
        if (!isTodayExam({ id: examId } as Exam)) {
            toast.success(`Viewing daily test from ${examDate}`);
        }
    };





    // Fetch articles using used_articles_id from the selected exam
    const articleIds = selectedExam?.used_articles_id || [];
    const { data: articles = [], isLoading: isLoadingArticles } = useFetchArticlesByIdsQuery(
        { article_ids: articleIds },
        { skip: articleIds.length === 0 }
    );

    if (isLoadingToday) {
        return <PageLoader variant="fullscreen" message="Loading daily practice..." />;
    }

    return (
        <div className={`min-h-screen relative ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
            {/* Subtle background gradient from Dashboard + Hint of Brand Accent */}
            <div className={`absolute inset-0 pointer-events-none ${isDark
                ? "bg-linear-to-br from-brand-primary-dark/5 via-transparent to-brand-accent-dark/5"
                : "bg-linear-to-br from-brand-primary-light/5 via-transparent to-brand-accent-light/5"
                }`} />

            <FloatingThemeToggle />
            <FloatingNavigation />

            <div className="min-h-screen overflow-x-hidden pl-18 sm:pl-20 md:pl-24 pr-4 lg:pr-8 py-4 sm:py-6 md:py-10 relative z-10 pb-20 sm:pb-24">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className={`font-serif font-bold text-3xl md:text-4xl mb-2 flex items-center gap-3 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                        Daily Practice
                    </h1>
                    <p className={`text-base max-w-3xl ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        Work through daily questions grounded in one shared article to build contextual clarity and topic
                        familiarity. This structure helps you grow knowledge steadily while training the exact skills CAT
                        VARC demands.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Main Content (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Control Bar: Date/Exam Info & Toggle */}
                        {selectedExam && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                {/* Exam Info */}
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                                        ${isTodayExam(selectedExam)
                                            ? "bg-brand-primary-light text-white shadow-lg shadow-brand-primary-light/20"
                                            : (isDark ? "bg-bg-tertiary-dark text-text-secondary-dark" : "bg-white text-gray-400 border border-gray-100")
                                        }
                                    `}>
                                        <CalendarCheck size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-semibold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                                {isTodayExam(selectedExam) ? "Today's Test" : "Past Test"}
                                            </h3>
                                            {isTodayExam(selectedExam) && (
                                                <span className={`px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded ${isDark ? "bg-brand-accent-dark/20 text-brand-accent-dark" : "bg-brand-accent-light/20 text-brand-primary-light"}`}>
                                                    Live
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                            {formatDate(selectedExam.created_at)}
                                        </p>
                                    </div>
                                </div>

                                {/* Segmented Toggle (Refactored with framer-motion) */}
                                <div
                                    className={cn(
                                        "p-1 rounded-lg flex items-center relative",
                                        isDark ? "bg-bg-tertiary-dark" : "bg-gray-100"
                                    )}
                                    role="tablist"
                                >
                                    {TOGGLE_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setViewMode(option.value as "test" | "leaderboard")}
                                            className={cn(
                                                "relative w-32 px-4 py-1.5 text-sm font-medium transition-colors z-10 flex justify-center",
                                                viewMode === option.value
                                                    ? (isDark ? "text-text-primary-dark" : "text-gray-900")
                                                    : (isDark ? "text-text-secondary-dark hover:text-text-primary-dark" : "text-gray-500 hover:text-gray-900")
                                            )}
                                            role="tab"
                                            aria-selected={viewMode === option.value}
                                        >
                                            {viewMode === option.value && (
                                                <motion.div
                                                    layoutId="view-mode-pill"
                                                    className={cn(
                                                        "absolute inset-0 rounded-md shadow-sm",
                                                        isDark ? "bg-bg-secondary-dark" : "bg-white"
                                                    )}
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                    style={{ zIndex: -1 }}
                                                />
                                            )}
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {viewMode === "test" ? (
                                <motion.div
                                    key="test-view"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    {/* Daily Features (RC/VA) */}
                                    {selectedExam && (
                                        <DailyFeatureWidget
                                            onStartPractice={handleStartPractice}
                                            isDark={isDark}
                                            featureEnabled={!!selectedExamId}
                                        />
                                    )}

                                    {/* No Test Warning */}
                                    {!hasTodayTest && !isLoadingToday && !selectedExam && (
                                        <div className={`p-6 rounded-xl border-l-4 border-red-500 ${isDark ? "bg-bg-secondary-dark" : "bg-white"}`}>
                                            <h3 className={`font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                                Daily Challenge Preparing...
                                            </h3>
                                            <p className={`text-sm mt-1 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                                Your personalized daily challenge is being curated. In the meantime, analyze your previous performance or try a sectional mock to keep your prep active.
                                            </p>
                                        </div>
                                    )}

                                    {/* Previous Tests List */}
                                    <div className="mt-8">
                                        <PreviousTestsContainer
                                            onExamSelect={handleExamSelect}
                                            selectedExamId={selectedExamId}
                                            todayExamId={todayData?.examInfo?.id || null}
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="leaderboard-view"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {selectedExam ? (
                                        <DailyLeaderboard examId={selectedExam.id} isDark={isDark} />
                                    ) : (
                                        <div className={`p-12 text-center rounded-xl border-2 border-dashed ${isDark ? "border-border-dark" : "border-border-light"}`}>
                                            Select a completed challenge to compare your reasoning speed and accuracy with top percentiles.
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Sidebar (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Article Source Widget */}
                        {selectedExam && viewMode === "test" && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-8"
                                >
                                    <h1 className={`font-serif font-bold text-2xl md:text-3xl mb-2 flex items-center gap-3 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                        Article
                                    </h1>
                                    <p className={`text-lg max-w-3xl ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                        Source material for today's practice session
                                    </p>
                                </motion.div>
                                <ArticleSourceWidget
                                    articles={articles}
                                    isLoading={isLoadingArticles}
                                    isDark={isDark}
                                />
                            </motion.div>
                        )}

                        {/* Additional Info / Stats Placeholder could go here */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyPage;
