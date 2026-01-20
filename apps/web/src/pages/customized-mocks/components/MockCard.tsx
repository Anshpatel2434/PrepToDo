import React from "react";
import { motion } from "framer-motion";
import { MdCheckCircle, MdPlayArrow, MdPending, MdAccessTime } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import type { CustomizedMockWithSession } from "../redux_usecase/customizedMocksApi";

interface MockCardProps {
    mock: CustomizedMockWithSession;
    index: number;
    isDark: boolean;
}

const MockCard: React.FC<MockCardProps> = ({ mock, index, isDark }) => {
    const navigate = useNavigate();
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getStatusBadge = () => {
        switch (mock.session_status) {
            case "completed":
                return {
                    icon: MdCheckCircle,
                    text: "Completed",
                    bgClass: isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700",
                };
            case "in_progress":
                return {
                    icon: MdPending,
                    text: "In Progress",
                    bgClass: isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700",
                };
            case "not_started":
            default:
                return {
                    icon: MdPlayArrow,
                    text: "Not Started",
                    bgClass: isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700",
                };
        }
    };

    const statusBadge = getStatusBadge();
    const StatusIcon = statusBadge.icon;

    const handleClick = () => {
        navigate(`/mock?exam_id=${mock.id}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            onClick={handleClick}
            className={`
                relative overflow-hidden p-6 rounded-2xl border-2 cursor-pointer
                group transition-all duration-300
                ${isDark
                    ? "bg-bg-secondary-dark border-border-dark hover:border-brand-primary-dark"
                    : "bg-bg-secondary-light border-border-light hover:border-brand-primary-light"
                }
                hover:shadow-xl transform hover:-translate-y-1
            `}
        >
            {/* Gradient Background on Hover */}
            <div
                className={`
                    absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                    ${isDark
                        ? "bg-gradient-to-br from-purple-600/10 to-blue-600/10"
                        : "bg-gradient-to-br from-purple-500/5 to-blue-500/5"
                    }
                `}
            />

            {/* Content */}
            <div className="relative z-10">
                {/* Header with Status Badge */}
                <div className="flex items-start justify-between mb-4">
                    <h3
                        className={`
                            font-serif font-bold text-xl flex-1
                            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                        `}
                    >
                        {mock.name}
                    </h3>
                    <span
                        className={`
                            flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                            ${statusBadge.bgClass}
                        `}
                    >
                        <StatusIcon className="w-4 h-4" />
                        {statusBadge.text}
                    </span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 mb-4">
                    <MdAccessTime
                        className={`w-4 h-4 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                            }`}
                    />
                    <p
                        className={`
                            text-sm
                            ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                        `}
                    >
                        {formatDate(mock.created_at)}
                    </p>
                </div>

                {/* Metadata */}
                <div
                    className={`
                        flex items-center gap-3 text-sm mb-4
                        ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                    `}
                >
                    <span>{mock.passages_count || 0} Passages</span>
                    <span>•</span>
                    <span>{mock.questions_count || 0} Questions</span>
                    {mock.time_limit_minutes && (
                        <>
                            <span>•</span>
                            <span>{mock.time_limit_minutes} min</span>
                        </>
                    )}
                </div>

                {/* Action Indicator */}
                <div className="flex items-center gap-2 mt-4">
                    <span
                        className={`
                            text-sm font-medium
                            ${isDark
                                ? "text-brand-primary-dark"
                                : "text-brand-primary-light"
                            }
                        `}
                    >
                        {mock.session_status === "completed"
                            ? "View Results"
                            : mock.session_status === "in_progress"
                                ? "Continue Test"
                                : "Start Test"}
                    </span>
                    <motion.span
                        className={`${isDark
                            ? "text-brand-primary-dark"
                            : "text-brand-primary-light"
                            }`}
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        →
                    </motion.span>
                </div>
            </div>
        </motion.div>
    );
};

export default MockCard;
