import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../../../context/ThemeContext";
import { MdHistory, MdArrowBack, MdArrowForward } from "react-icons/md";
import type { Exam } from "../../../../types";
import { useFetchPreviousDailyTestsQuery } from "../redux_usecase/dailyPracticeApi";

interface PreviousTestsContainerProps {
    onExamSelect: (examId: string) => void;
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
        return todayExamId === examId;
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
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-light"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="max-w-4xl mx-auto"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"
                    }`}
                >
                    <MdHistory
                        className={`w-6 h-6 ${
                            isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}
                    />
                </div>
                <h2
                    className={`text-2xl font-serif font-bold ${
                        isDark ? "text-text-primary-dark" : "text-text-primary-light"
                    }`}
                >
                    Previous Daily Tests
                </h2>
            </div>

            {/* Tests Container */}
            {previousTests && previousTests.length > 0 ? (
                <div
                    className={`rounded-2xl border-2 ${
                        isDark
                            ? "bg-bg-secondary-dark border-border-dark"
                            : "bg-bg-secondary-light border-border-light"
                    }`}
                >
                    {/* Test List */}
                    <div className="divide-y divide-y-2">
                        {previousTests.map((exam, index) => (
                            <motion.button
                                key={exam.id}
                                onClick={() => onExamSelect(exam.id)}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + index * 0.02, duration: 0.3 }}
                                className={`
                                    w-full px-6 py-4 flex items-center justify-between
                                    transition-all duration-200
                                    ${
                                        selectedExamId === exam.id
                                            ? isDark
                                                ? "bg-brand-primary-dark/20"
                                                : "bg-brand-primary-light/20"
                                            : isDark
                                            ? "hover:bg-bg-tertiary-dark/50"
                                            : "hover:bg-bg-tertiary-light/50"
                                    }
                                    ${
                                        isTodayExam(exam.id)
                                            ? "border-l-4 border-amber-500"
                                            : ""
                                    }
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`
                                            w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold
                                            ${
                                                isTodayExam(exam.id)
                                                    ? "bg-amber-500 text-white"
                                                    : isDark
                                                    ? "bg-bg-tertiary-dark text-text-primary-dark"
                                                    : "bg-bg-tertiary-light text-text-primary-light"
                                            }
                                        `}
                                    >
                                        {getTestNumber(index)}
                                    </div>
                                    <div className="text-left">
                                        <h3
                                            className={`font-semibold ${
                                                isDark
                                                    ? "text-text-primary-dark"
                                                    : "text-text-primary-light"
                                            }`}
                                        >
                                            Daily Test #{getTestNumber(index)}
                                        </h3>
                                        <p
                                            className={`text-sm ${
                                                isDark
                                                    ? "text-text-secondary-dark"
                                                    : "text-text-secondary-light"
                                            }`}
                                        >
                                            {formatDate(exam.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isTodayExam(exam.id) && (
                                        <span className="px-3 py-1 bg-amber-500 text-white text-xs rounded-full font-medium">
                                            TODAY
                                        </span>
                                    )}
                                    <MdHistory
                                        className={`w-5 h-5 ${
                                            isDark
                                                ? "text-text-secondary-dark"
                                                : "text-text-secondary-light"
                                        }`}
                                    />
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    <div
                        className={`px-6 py-4 border-t-2 flex items-center justify-between ${
                            isDark ? "border-border-dark" : "border-border-light"
                        }`}
                    >
                        <span
                            className={`text-sm ${
                                isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                            }`}
                        >
                            Page {currentPage}
                        </span>
                        <div className="flex gap-2">
                            <motion.button
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                                whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                                whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                                className={`
                                    px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200
                                    ${
                                        currentPage === 1
                                            ? "opacity-50 cursor-not-allowed"
                                            : isDark
                                            ? "hover:bg-bg-tertiary-dark"
                                            : "hover:bg-bg-tertiary-light"
                                    }
                                    ${
                                        isDark
                                            ? "bg-bg-secondary-dark text-text-primary-dark border-border-dark border-2"
                                            : "bg-bg-secondary-light text-text-primary-light border-border-light border-2"
                                    }
                                `}
                            >
                                <MdArrowBack size={16} />
                                <span className="text-sm font-medium">Previous</span>
                            </motion.button>
                            <motion.button
                                onClick={handleNextPage}
                                disabled={previousTests.length < itemsPerPage}
                                whileHover={{ scale: previousTests.length < itemsPerPage ? 1 : 1.05 }}
                                whileTap={{ scale: previousTests.length < itemsPerPage ? 1 : 0.95 }}
                                className={`
                                    px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200
                                    ${
                                        previousTests.length < itemsPerPage
                                            ? "opacity-50 cursor-not-allowed"
                                            : isDark
                                            ? "hover:bg-bg-tertiary-dark"
                                            : "hover:bg-bg-tertiary-light"
                                    }
                                    ${
                                        isDark
                                            ? "bg-bg-secondary-dark text-text-primary-dark border-border-dark border-2"
                                            : "bg-bg-secondary-light text-text-primary-light border-border-light border-2"
                                    }
                                `}
                            >
                                <span className="text-sm font-medium">Next</span>
                                <MdArrowForward size={16} />
                            </motion.button>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className={`
                        text-center py-12 rounded-2xl border-2 border-dashed
                        ${isDark ? "border-border-dark" : "border-border-light"}
                    `}
                >
                    <MdHistory
                        className={`w-16 h-16 mx-auto mb-4 ${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                    />
                    <p
                        className={`text-lg font-medium mb-2 ${
                            isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}
                    >
                        No Previous Tests
                    </p>
                    <p
                        className={`text-sm ${
                            isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}
                    >
                        Complete today's challenge to see it here!
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default PreviousTestsContainer;
