import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import {
    useFetchPreviousDailyExamsQuery,
} from "../redux_usecase/dailyPracticeApi";
import { MdHistory, MdArrowForward, MdMenuBook, MdSpellcheck } from "react-icons/md";

interface PreviousExamsPaginationProps {
    type: "rc" | "va";
}

const PreviousExamsPagination: React.FC<PreviousExamsPaginationProps> = ({ type }) => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const { data: previousExams, isLoading, error } = useFetchPreviousDailyExamsQuery();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getExamTypeLabel = (examName: string) => {
        if (examName.toLowerCase().includes("rc") || examName.toLowerCase().includes("reading")) {
            return {
                label: "Reading Comprehension",
                icon: MdMenuBook,
                color: isDark ? "text-blue-400" : "text-blue-600",
                type: "rc",
            };
        }
        return {
            label: "Verbal Ability",
            icon: MdSpellcheck,
            color: isDark ? "text-green-400" : "text-green-600",
            type: "va",
        };
    };

    const handleExamClick = (examId: string) => {
        navigate(`/daily/${type}?exam_id=${examId}`);
    };

    if (isLoading) {
        return (
            <div className="mt-12 max-w-6xl mx-auto">
                <h3
                    className={`
                        font-semibold mb-6 flex items-center gap-2
                        ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                    `}
                >
                    <MdHistory className="w-5 h-5" />
                    Previous Daily Tests
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`
                                h-24 rounded-xl border
                                ${isDark ? "bg-bg-secondary-dark border-border-dark" : "bg-bg-secondary-light border-border-light"}
                                animate-pulse
                            `}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !previousExams || previousExams.length === 0) {
        return null;
    }

    // Filter exams based on type (RC or VA)
    const filteredExams = previousExams.filter((exam) => {
        if (type === "rc") {
            return exam.exam_type.toLowerCase().includes("rc") ||
                   exam.name.toLowerCase().includes("reading") ||
                   exam.name.toLowerCase().includes("rc");
        } else {
            return exam.exam_type.toLowerCase().includes("va") ||
                   exam.name.toLowerCase().includes("verbal") ||
                   exam.name.toLowerCase().includes("va");
        }
    });

    if (filteredExams.length === 0) {
        return null;
    }

    return (
        <div className="mt-16 max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
            >
                <h3
                    className={`
                        font-serif font-bold text-xl md:text-2xl mb-6 flex items-center gap-2
                        ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                    `}
                >
                    <MdHistory className="w-6 h-6" />
                    Previous Daily {type.toUpperCase()} Tests
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredExams.map((exam, index) => {
                        const examType = getExamTypeLabel(exam.name);
                        const Icon = examType.icon;
                        return (
                            <motion.button
                                key={exam.id}
                                onClick={() => handleExamClick(exam.id)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                                className={`
                                    relative overflow-hidden p-5 rounded-xl border text-left group
                                    transition-all duration-300
                                    ${
                                        isDark
                                            ? "bg-bg-secondary-dark border-border-dark hover:border-brand-primary-dark hover:shadow-lg hover:shadow-brand-primary-dark/10"
                                            : "bg-bg-secondary-light border-border-light hover:border-brand-primary-light hover:shadow-lg hover:shadow-brand-primary-light/10"
                                    }
                                `}
                            >
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2 rounded-lg ${isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"}`}>
                                            <Icon className={`w-5 h-5 ${examType.color}`} />
                                        </div>
                                        <MdArrowForward
                                            className={`
                                                w-5 h-5 transition-all duration-300 transform group-hover:translate-x-1
                                                ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                            `}
                                        />
                                    </div>
                                    <h4
                                        className={`
                                            font-serif font-semibold text-base mb-1
                                            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                                        `}
                                    >
                                        Daily {type.toUpperCase()}
                                    </h4>
                                    <p
                                        className={`
                                            text-sm font-medium mb-2
                                            ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                        `}
                                    >
                                        {formatDate(exam.created_at)}
                                    </p>
                                    <span
                                        className={`
                                            inline-block px-2 py-0.5 rounded-full text-xs font-medium
                                            ${isDark ? "bg-bg-tertiary-dark text-text-secondary-dark" : "bg-bg-tertiary-light text-text-secondary-light"}
                                        `}
                                    >
                                        Past Test
                                    </span>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};

export default PreviousExamsPagination;
