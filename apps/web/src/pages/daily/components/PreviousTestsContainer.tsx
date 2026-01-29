import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    History,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    ArrowRight
} from "lucide-react";
import { useFetchPreviousDailyTestsQuery } from "../redux_usecase/dailyPracticeApi";
import { useTheme } from "../../../context/ThemeContext";

interface PreviousTestsContainerProps {
    onExamSelect: (examId: string, examDate: string) => void;
    selectedExamId: string | null;
    todayExamId: string | null;
}

const PreviousTestsContainer: React.FC<PreviousTestsContainerProps> = ({
    onExamSelect,
    selectedExamId,
    todayExamId,
}) => {
    const { isDark } = useTheme();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const { data: previousTests, isLoading } = useFetchPreviousDailyTestsQuery({
        page: currentPage,
        limit: itemsPerPage,
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const isTodayExam = (examId: string) => {
        if (!todayExamId || !previousTests) return false;
        const exam = previousTests.find(e => e.id === examId);
        if (!exam) return todayExamId === examId;
        const today = new Date().toISOString().split('T')[0];
        const examDate = new Date(exam.created_at).toISOString().split('T')[0];
        return todayExamId === examId && examDate === today;
    };

    const getTestNumber = (index: number) => {
        return (currentPage - 1) * itemsPerPage + index + 1;
    };

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => prev + 1);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary-light"></div>
            </div>
        );
    }

    const containerVariants = {
        visible: {
            transition: {
                staggerChildren: 0.03,
            },
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { type: "spring" as const, stiffness: 300, damping: 25 }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
        >
            {/* Legend/Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? "bg-bg-tertiary-dark text-brand-primary-dark" : "bg-brand-primary-light/10 text-brand-primary-light"}`}>
                        <History size={22} />
                    </div>
                    <div>
                        <h2 className={`text-2xl font-bold tracking-tight ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            Previous Daily Challenges
                        </h2>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {previousTests && previousTests.length > 0 ? (
                <div className="space-y-6">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <AnimatePresence mode="popLayout">
                            {previousTests.map((exam, index) => {
                                const isCurrent = selectedExamId === exam.id;
                                const isToday = isTodayExam(exam.id);

                                return (
                                    <motion.button
                                        key={exam.id}
                                        variants={cardVariants}
                                        layout
                                        onClick={() => onExamSelect(exam.id, formatDate(exam.created_at))}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`
                                            relative w-full p-5 flex items-center gap-1 rounded-3xl text-left border backdrop-blur-md group
                                            ${isCurrent
                                                ? (isDark
                                                    ? "bg-brand-primary-dark/20 border-brand-primary-dark shadow-lg shadow-brand-primary-dark/10"
                                                    : "bg-brand-primary-light/10 border-brand-primary-light shadow-lg shadow-brand-primary-light/10")
                                                : (isDark
                                                    ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                                                    : "bg-white/60 border-black/5 hover:bg-white hover:shadow-xl hover:shadow-brand-primary-light/10")
                                            }
                                        `}
                                    >
                                        {isToday && (
                                            <div className="absolute top-0 right-6 translate-y-[-50%] px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-tighter rounded-full shadow-lg">
                                                Live Now
                                            </div>
                                        )}

                                        <div className={`
                                            w-8 h-8 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 border-2
                                            ${isToday
                                                ? "bg-amber-500 text-white border-amber-400 rotate-[-4deg]"
                                                : isDark
                                                    ? "bg-bg-tertiary-dark text-text-primary-dark border-white/5"
                                                    : "bg-gray-50 text-text-primary-light border-gray-100"
                                            }
                                        `}>
                                            {getTestNumber(index)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className={`flex items-center justify-center gap-2  font-bold truncate text-lg ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                                <CalendarDays size={16} />
                                                <span>{formatDate(exam.created_at)}</span>
                                            </h3>
                                        </div>

                                        <div className={`p-2 rounded-xl transition-transform group-hover:translate-x-1 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                                            <ArrowRight size={14} className="opacity-30" />
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-6">
                        <p className={`text-xs font-bold uppercase tracking-widest opacity-40 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            Page {currentPage} Overflow
                        </p>
                        <div className="flex gap-3">
                            <motion.button
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all
                                    border-2 ${isDark ? "border-white/5" : "border-gray-100 bg-white shadow-sm"}
                                    ${currentPage === 1 ? "opacity-30 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
                                `}
                            >
                                <ChevronLeft size={16} />
                                <span>Previous</span>
                            </motion.button>
                            <motion.button
                                onClick={handleNextPage}
                                disabled={previousTests.length < itemsPerPage}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all
                                    border-2 ${isDark ? "border-white/5" : "border-gray-100 bg-white shadow-sm"}
                                    ${previousTests.length < itemsPerPage ? "opacity-30 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
                                `}
                            >
                                <span>Next</span>
                                <ChevronRight size={16} />
                            </motion.button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`text-center py-20 rounded-[2.5rem] border-2 border-dashed ${isDark ? "border-white/10" : "border-gray-100 bg-gray-50/30"}`}>
                    <div className="w-20 h-20 rounded-full bg-gray-400/10 flex items-center justify-center mx-auto mb-6">
                        <History className="opacity-20" size={32} />
                    </div>
                    <p className={`text-xl font-bold mb-2 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                        No History Found
                    </p>
                    <p className={`text-sm opacity-50 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        Your past achievements will appear here once you complete a challenge.
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default PreviousTestsContainer;
