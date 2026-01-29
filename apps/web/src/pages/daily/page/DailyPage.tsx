import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useTheme } from "../../../context/ThemeContext";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { CalendarCheck } from "lucide-react";
import type { Exam } from "../../../types";
import { useFetchDailyTestDataQuery, useFetchPreviousDailyTestsQuery, useFetchArticlesByIdsQuery } from "../redux_usecase/dailyPracticeApi";
import PreviousTestsContainer from "../components/PreviousTestsContainer";
import DailyLeaderboard from "../components/DailyLeaderboard";
import { DailyFeatureWidget } from "../components/DailyFeatureWidget";
import { ArticleSourceWidget } from "../components/ArticleSourceWidget";

const DailyPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isDark } = useTheme();
    const [viewMode, setViewMode] = useState<"test" | "leaderboard">("test");

    // Fetch today's daily test data
    const { data: todayData, isLoading: isLoadingToday } = useFetchDailyTestDataQuery();

    // Fetch previous daily tests (first page only, for getting exam info when selected via URL)
    const { data: previousTests } = useFetchPreviousDailyTestsQuery({ page: 1, limit: 20 });

    // Check if there's a test for today
    const hasTodayTest = !!todayData?.examInfo;

    // Compute selected exam ID from URL params or default to today's exam
    const urlExamId = searchParams.get('exam_id');
    const selectedExamId = urlExamId || todayData?.examInfo?.id || null;

    const handleStartPractice = async (type: "rc" | "va") => {
        if (!selectedExamId) {
            console.error("No exam_id selected");
            return;
        }
        console.log("[DailyPage] handleStartPractice called for type:", type);
        navigate(`/daily/${type}?exam_id=${selectedExamId}`);
    };

    const getSelectedExamInfo = (): Exam | null => {
        // If we have today's data and it's selected, return it
        if (todayData?.examInfo && selectedExamId === todayData.examInfo.id) {
            return todayData.examInfo;
        }

        // Otherwise, search in previous tests
        return previousTests?.find(exam => exam.id === selectedExamId) || null;
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



    const selectedExam = getSelectedExamInfo();

    // Fetch articles using used_articles_id from the selected exam
    const articleIds = selectedExam?.used_articles_id || [];
    const { data: articles = [], isLoading: isLoadingArticles } = useFetchArticlesByIdsQuery(
        { article_ids: articleIds },
        { skip: articleIds.length === 0 }
    );

    if (isLoadingToday) {
        return (
            <div className={`min-h-screen ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
                } flex items-center justify-center`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-primary-light"></div>
                    <p className={`mt-4 text-lg ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}>Loading daily practice...</p>
                </div>
            </div>
        );
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
                    <p className={`text-base max-w-2xl ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        Sharpen your skills with daily sessions.
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

                                {/* Segmented Toggle */}
                                <div className={`
                                    p-1 rounded-lg flex items-center
                                    ${isDark ? "bg-bg-tertiary-dark" : "bg-gray-100"}
                                `}>
                                    <button
                                        onClick={() => setViewMode("test")}
                                        className={`
                                            px-4 py-1.5 rounded-md text-sm font-medium transition-all
                                            ${viewMode === "test"
                                                ? (isDark ? "bg-bg-secondary-dark text-text-primary-dark shadow-sm" : "bg-white text-gray-900 shadow-sm")
                                                : (isDark ? "text-text-secondary-dark hover:text-text-primary-dark" : "text-gray-500 hover:text-gray-900")
                                            }
                                        `}
                                    >
                                        Practice
                                    </button>
                                    <button
                                        onClick={() => setViewMode("leaderboard")}
                                        className={`
                                            px-4 py-1.5 rounded-md text-sm font-medium transition-all
                                            ${viewMode === "leaderboard"
                                                ? (isDark ? "bg-bg-secondary-dark text-text-primary-dark shadow-sm" : "bg-white text-gray-900 shadow-sm")
                                                : (isDark ? "text-text-secondary-dark hover:text-text-primary-dark" : "text-gray-500 hover:text-gray-900")
                                            }
                                        `}
                                    >
                                        Leaderboard
                                    </button>
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
                                                No Test Generated Today
                                            </h3>
                                            <p className={`text-sm mt-1 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                                Please check back later or practice with previous tests regarding.
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
                                            Please select an exam to view the leaderboard.
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
