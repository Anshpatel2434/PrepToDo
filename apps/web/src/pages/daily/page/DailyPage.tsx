import React from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { MdMenuBook, MdSpellcheck, MdHistory } from "react-icons/md";
import type { Exam } from "../../../types";
import { useFetchDailyTestDataQuery, useFetchPreviousDailyTestsQuery } from "../redux_usecase/dailyPracticeApi";

const DailyPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isDark } = useTheme();

    // Fetch today's daily test data
    const { data: todayData, isLoading: isLoadingToday } = useFetchDailyTestDataQuery();
    
    // Fetch previous daily tests
    const { data: previousTests, isLoading: isLoadingPrevious } = useFetchPreviousDailyTestsQuery({ limit: 20 });

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

    const handleExamSelect = (examId: string) => {
        navigate(`/daily?exam_id=${examId}`);
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
        return todayData?.examInfo?.id === exam.id;
    };

    const practiceOptions = [
        {
            id: "rc",
            title: "Reading Comprehension",
            description:
                "Practice passage-based questions and improve your reading skills",
            icon: MdMenuBook,
            route: "/daily/rc",
            gradient: isDark
                ? "from-blue-600/20 to-purple-600/20"
                : "from-blue-500/10 to-purple-500/10",
            iconColor: isDark ? "text-blue-400" : "text-blue-600",
        },
        {
            id: "va",
            title: "Verbal Ability",
            description: "Master para jumbles, summaries, and sentence completion",
            icon: MdSpellcheck,
            route: "/daily/va",
            gradient: isDark
                ? "from-green-600/20 to-teal-600/20"
                : "from-green-500/10 to-teal-500/10",
            iconColor: isDark ? "text-green-400" : "text-green-600",
        },
    ];

    const selectedExam = getSelectedExamInfo();

    if (isLoadingToday) {
        return (
            <div className={`min-h-screen ${
                isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
            } flex items-center justify-center`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-primary-light"></div>
                    <p className={`mt-4 text-lg ${
                        isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                    }`}>Loading daily practice...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`min-h-screen ${
                isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
            }`}
        >
            <FloatingThemeToggle />
            <FloatingNavigation />

            <div className="container mx-auto px-6 py-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h1
                        className={`
                            font-serif font-bold text-3xl md:text-5xl mb-4
                            ${
                                isDark
                                    ? "text-text-primary-dark"
                                    : "text-text-primary-light"
                            }
                        `}
                    >
                        Daily Practice
                    </h1>
                    <p
                        className={`
                            text-base md:text-lg max-w-2xl mx-auto
                            ${
                                isDark
                                    ? "text-text-secondary-dark"
                                    : "text-text-secondary-light"
                            }
                        `}
                    >
                        Sharpen your skills with focused daily practice sessions. Choose
                        your area of focus below.
                    </p>
                </motion.div>

                {/* Selected Exam Info */}
                {selectedExam && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className={`
                            max-w-4xl mx-auto mb-8 p-6 rounded-xl border-2
                            ${isTodayExam(selectedExam)
                                ? (isDark
                                    ? "bg-linear-to-r from-amber-900/20 to-orange-900/20 border-amber-500/50"
                                    : "bg-linear-to-r from-amber-50 to-orange-50 border-amber-300")
                                : (isDark
                                    ? "bg-bg-secondary-dark border-border-dark"
                                    : "bg-bg-secondary-light border-border-light")
                            }
                        `}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3
                                        className={`
                                            text-lg font-semibold
                                            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                                        `}
                                    >
                                        {isTodayExam(selectedExam) ? "Today's Challenge" : "Practice Test"}
                                    </h3>
                                    {isTodayExam(selectedExam) && (
                                        <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded-full font-medium">
                                            TODAY
                                        </span>
                                    )}
                                </div>
                                <p
                                    className={`
                                        text-sm
                                        ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                    `}
                                >
                                    {formatDate(selectedExam.created_at)}
                                </p>
                            </div>
                            <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center
                                ${isTodayExam(selectedExam)
                                    ? "bg-amber-500 text-white"
                                    : (isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light")
                                }
                            `}>
                                <MdHistory size={24} />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Practice Options Grid */}
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 mb-12">
                    {practiceOptions.map((option, index) => {
                        const Icon = option.icon;
                        return (
                            <motion.button
                                key={option.id}
                                onClick={() => handleStartPractice(option.id as "rc" | "va")}
                                disabled={!selectedExamId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                                className={`
                                    relative overflow-hidden p-8 rounded-2xl
                                    border-2 text-left group
                                    ${!selectedExamId ? 'opacity-50 cursor-not-allowed' : 'hover:cursor-pointer'}
                                    ${
                                        selectedExamId
                                            ? (isDark
                                                ? "bg-bg-secondary-dark border-border-dark hover:border-brand-primary-dark"
                                                : "bg-bg-secondary-light border-border-light hover:border-brand-primary-light")
                                            : (isDark
                                                ? "bg-bg-secondary-dark border-border-dark"
                                                : "bg-bg-secondary-light border-border-light")
                                    }
                                `}
                            >
                                {/* Gradient Background */}
                                <div
                                    className={`
                                        absolute inset-0 bg-linear-to-br ${option.gradient}
                                        opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                    `}
                                />

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div
                                            className={`
                                                p-3 rounded-xl
                                                ${isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"}
                                            `}
                                        >
                                            <Icon className={`w-8 h-8 ${option.iconColor}`} />
                                        </div>
                                        <h2
                                            className={`
                                                font-serif font-bold text-xl md:text-2xl
                                                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                                            `}
                                        >
                                            {option.title}
                                        </h2>
                                    </div>
                                    <p
                                        className={`
                                            leading-relaxed mb-4
                                            ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                        `}
                                    >
                                        {option.description}
                                    </p>

                                    {/* Arrow indicator or Loading */}
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`text-sm font-medium ${
                                                isDark
                                                    ? "text-brand-primary-dark"
                                                    : "text-brand-primary-light"
                                            }`}
                                        >
                                            {selectedExamId ? "Start Practice" : "Select an exam first"}
                                        </span>
                                        {selectedExamId && (
                                            <motion.span
                                                className={`${
                                                    isDark
                                                        ? "text-brand-primary-dark"
                                                        : "text-brand-primary-light"
                                                }`}
                                                animate={{ x: [0, 4, 0] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                            >
                                                →
                                            </motion.span>
                                        )}
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Previous Tests Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="max-w-6xl mx-auto"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center
                            ${isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"}
                        `}>
                            <MdHistory className={`w-6 h-6 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`} />
                        </div>
                        <h2 className={`
                            text-2xl font-serif font-bold
                            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                        `}>
                            Previous Daily Tests
                        </h2>
                    </div>

                    {isLoadingPrevious ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-light"></div>
                        </div>
                    ) : previousTests && previousTests.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {previousTests.map((exam, index) => (
                                <motion.button
                                    key={exam.id}
                                    onClick={() => handleExamSelect(exam.id)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + index * 0.05, duration: 0.3 }}
                                    className={`
                                        p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-105
                                        ${selectedExamId === exam.id
                                            ? (isDark
                                                ? "bg-brand-primary-dark/20 border-brand-primary-dark"
                                                : "bg-brand-primary-light/20 border-brand-primary-light")
                                            : (isDark
                                                ? "bg-bg-secondary-dark border-border-dark hover:border-brand-primary-dark/50"
                                                : "bg-bg-secondary-light border-border-light hover:border-brand-primary-light/50")
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`
                                            w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium
                                            ${isTodayExam(exam)
                                                ? "bg-amber-500 text-white"
                                                : (isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light")
                                            }
                                        `}>
                                            {index + 1}
                                        </div>
                                        {isTodayExam(exam) && (
                                            <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded-full font-medium">
                                                TODAY
                                            </span>
                                        )}
                                    </div>
                                    <h3 className={`
                                        font-medium mb-1
                                        ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                                    `}>
                                        Daily Test #{previousTests.length - index}
                                    </h3>
                                    <p className={`
                                        text-sm
                                        ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                    `}>
                                        {formatDate(exam.created_at)}
                                    </p>
                                </motion.button>
                            ))}
                        </div>
                    ) : (
                        <div className={`
                            text-center py-12 rounded-xl border-2 border-dashed
                            ${isDark ? "border-border-dark" : "border-border-light"}
                        `}>
                            <MdHistory className={`w-16 h-16 mx-auto mb-4 ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`} />
                            <p className={`
                                text-lg font-medium mb-2
                                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                            `}>
                                No Previous Tests
                            </p>
                            <p className={`
                                text-sm
                                ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                            `}>
                                Complete today's challenge to see it here!
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* Info Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className={`
                        mt-12 max-w-2xl mx-auto p-6 rounded-xl border
                        ${isDark ? "bg-bg-secondary-dark border-border-dark" : "bg-bg-secondary-light border-border-light"}
                    `}
                >
                    <h3
                        className={`
                            font-semibold mb-3
                            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                        `}
                    >
                        📊 Practice Features
                    </h3>
                    <ul
                        className={`
                            space-y-2 text-sm
                            ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                        `}
                    >
                        <li>✓ Practice sessions with time tracking</li>
                        <li>✓ Detailed solutions after completion</li>
                        <li>✓ Mark questions for review</li>
                        <li>✓ Track your progress and improve accuracy</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
};

export default DailyPage;
