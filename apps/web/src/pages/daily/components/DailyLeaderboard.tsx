import React from "react";
import { motion } from "framer-motion";
import { FaTrophy, FaClock, FaCheckCircle, FaQuestionCircle } from "react-icons/fa";
import { useFetchDailyLeaderboardQuery } from "../redux_usecase/dailyPracticeApi";
import type { UUID } from "../../../types";

interface DailyLeaderboardProps {
    examId: UUID;
    isDark: boolean;
}

const DailyLeaderboard: React.FC<DailyLeaderboardProps> = ({ examId, isDark }) => {
    const { data, isLoading, error } = useFetchDailyLeaderboardQuery({ exam_id: examId });

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return "text-yellow-500";
        if (rank === 2) return "text-gray-400";
        if (rank === 3) return "text-amber-600";
        return isDark ? "text-text-secondary-dark" : "text-text-secondary-light";
    };

    const getRankBg = (rank: number) => {
        if (rank === 1) return "bg-yellow-500/20";
        if (rank === 2) return "bg-gray-400/20";
        if (rank === 3) return "bg-amber-600/20";
        return isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light";
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary-light mb-4"></div>
                <p className={`text-lg ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                    Loading leaderboard...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className={`
                    max-w-2xl mx-auto p-8 rounded-2xl border-2 text-center
                    ${isDark
                        ? "bg-red-900/10 border-red-500/30"
                        : "bg-red-50 border-red-200"}
                `}
            >
                <p className={`text-lg font-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                    Failed to load leaderboard
                </p>
                <p className={`text-sm mt-2 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                    Please try again later
                </p>
            </div>
        );
    }

    if (!data || data.leaderboard.length === 0) {
        return (
            <div
                className={`
                    max-w-2xl mx-auto p-12 rounded-2xl border-2 border-dashed text-center
                    ${isDark ? "border-border-dark" : "border-border-light"}
                `}
            >
                <FaTrophy
                    className={`w-20 h-20 mx-auto mb-4 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                />
                <p className={`text-xl font-medium mb-2 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                    No Participants Yet
                </p>
                <p className={`text-sm ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                    Be the first to complete this daily test and claim the top spot!
                </p>
            </div>
        );
    }

    const { leaderboard, currentUserRank, totalParticipants } = data;
    const top30 = leaderboard.slice(0, 30);
    const currentUserEntry = leaderboard.find(entry => entry.rank === currentUserRank);
    const showCurrentUserSeparately = currentUserRank !== null && currentUserRank > 30 && currentUserEntry;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Stats Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`
                    p-6 rounded-2xl border-2
                    ${isDark
                        ? "bg-bg-secondary-dark border-border-dark"
                        : "bg-bg-secondary-light border-border-light"}
                `}
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getRankBg(1)}`}>
                            <FaTrophy className="w-7 h-7 text-yellow-500" />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-serif font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                Daily Leaderboard
                            </h2>
                            <p className={`text-sm ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                {totalParticipants} {totalParticipants === 1 ? "participant" : "participants"}
                            </p>
                        </div>
                    </div>
                    {currentUserRank !== null && (
                        <div className={`px-4 py-2 rounded-lg ${isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"}`}>
                            <p className={`text-sm ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                Your Rank
                            </p>
                            <p className={`text-2xl font-bold ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`}>
                                #{currentUserRank}
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Leaderboard Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className={`
                    rounded-2xl border-2 overflow-hidden
                    ${isDark
                        ? "bg-bg-secondary-dark border-border-dark"
                        : "bg-bg-secondary-light border-border-light"}
                `}
            >
                {/* Table Header */}
                <div
                    className={`
                        grid grid-cols-12 gap-4 px-6 py-4 border-b-2 font-semibold text-sm
                        ${isDark
                            ? "bg-bg-tertiary-dark border-border-dark text-text-secondary-dark"
                            : "bg-bg-tertiary-light border-border-light text-text-secondary-light"}
                    `}
                >
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-4">User</div>
                    <div className="col-span-2 text-center">Score</div>
                    <div className="col-span-2 text-center">Accuracy</div>
                    <div className="col-span-3 text-center">Time</div>
                </div>

                {/* Leaderboard Entries */}
                <div className="divide-y divide-border-light dark:divide-border-dark">
                    {top30.map((entry, index) => (
                        <motion.div
                            key={entry.user_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03, duration: 0.3 }}
                            className={`
                                grid grid-cols-12 gap-4 px-6 py-4 items-center
                                ${entry.rank === currentUserRank
                                    ? isDark
                                        ? "bg-brand-primary-dark/10 border-l-4 border-brand-primary-dark"
                                        : "bg-brand-primary-light/10 border-l-4 border-brand-primary-light"
                                    : "hover:bg-opacity-50"}
                                ${isDark ? "hover:bg-bg-tertiary-dark" : "hover:bg-bg-tertiary-light"}
                            `}
                        >
                            {/* Rank */}
                            <div className="col-span-1">
                                <div
                                    className={`
                                        w-10 h-10 rounded-lg flex items-center justify-center font-bold
                                        ${getRankBg(entry.rank)} ${getRankColor(entry.rank)}
                                    `}
                                >
                                    {entry.rank <= 3 ? (
                                        <FaTrophy className="w-5 h-5" />
                                    ) : (
                                        <span className="text-sm">#{entry.rank}</span>
                                    )}
                                </div>
                            </div>

                            {/* User */}
                            <div className="col-span-4">
                                <p className={`font-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                    {entry.username || "Anonymous"}
                                </p>
                                {entry.rank === currentUserRank && currentUserRank !== null && (
                                    <span className={`text-xs ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`}>
                                        (You)
                                    </span>
                                )}
                            </div>

                            {/* Score */}
                            <div className="col-span-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <FaCheckCircle className={`w-4 h-4 ${isDark ? "text-green-400" : "text-green-600"}`} />
                                    <span className={`font-semibold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                        {entry.score}
                                    </span>
                                </div>
                            </div>

                            {/* Accuracy */}
                            <div className="col-span-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <FaQuestionCircle className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                                    <span className={`font-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                        {entry.accuracy.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* Time */}
                            <div className="col-span-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <FaClock className={`w-4 h-4 ${isDark ? "text-orange-400" : "text-orange-600"}`} />
                                    <span className={`font-medium ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                        {formatTime(entry.time_taken_seconds)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Current User Entry (if outside top 30) */}
            {showCurrentUserSeparately && currentUserEntry && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className={`
                        rounded-2xl border-2 overflow-hidden
                        ${isDark
                            ? "bg-brand-primary-dark/10 border-brand-primary-dark"
                            : "bg-brand-primary-light/10 border-brand-primary-light"}
                    `}
                >
                    <div className={`px-6 py-3 border-b-2 ${isDark ? "border-brand-primary-dark" : "border-brand-primary-light"}`}>
                        <p className={`text-sm font-semibold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            Your Position
                        </p>
                    </div>
                    <div
                        className={`
                            grid grid-cols-12 gap-4 px-6 py-4 items-center
                        `}
                    >
                        {/* Rank */}
                        <div className="col-span-1">
                            <div
                                className={`
                                    w-10 h-10 rounded-lg flex items-center justify-center font-bold
                                    ${isDark ? "bg-brand-primary-dark/20 text-brand-primary-dark" : "bg-brand-primary-light/20 text-brand-primary-light"}
                                `}
                            >
                                <span className="text-sm">#{currentUserEntry.rank}</span>
                            </div>
                        </div>

                        {/* User */}
                        <div className="col-span-4">
                            <p className={`font-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                {currentUserEntry.username || "Anonymous"}
                            </p>
                            <span className={`text-xs ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`}>
                                (You)
                            </span>
                        </div>

                        {/* Score */}
                        <div className="col-span-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <FaCheckCircle className={`w-4 h-4 ${isDark ? "text-green-400" : "text-green-600"}`} />
                                <span className={`font-semibold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                    {currentUserEntry.score}
                                </span>
                            </div>
                        </div>

                        {/* Accuracy */}
                        <div className="col-span-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <FaQuestionCircle className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                                <span className={`font-medium ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                    {currentUserEntry.accuracy.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        {/* Time */}
                        <div className="col-span-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <FaClock className={`w-4 h-4 ${isDark ? "text-orange-400" : "text-orange-600"}`} />
                                <span className={`font-medium ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                    {formatTime(currentUserEntry.time_taken_seconds)}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default DailyLeaderboard;