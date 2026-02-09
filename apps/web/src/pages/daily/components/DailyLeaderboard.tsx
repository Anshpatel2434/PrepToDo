import React, { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
    Trophy,
    Clock,
    HelpCircle,
    ChevronDown,
    UserCircle,
} from "lucide-react";
import { useFetchDailyLeaderboardQuery } from "../redux_usecase/dailyPracticeApi";
import type { UUID } from "../../../types";
import { PageLoader } from "../../../ui_components/PageLoader";

interface DailyLeaderboardProps {
    examId: UUID;
    isDark: boolean;
}

type SortField = "rank" | "accuracy" | "time_taken_seconds";
type SortOrder = "asc" | "desc";

const DailyLeaderboard: React.FC<DailyLeaderboardProps> = ({ examId, isDark }) => {
    const { data, isLoading, error } = useFetchDailyLeaderboardQuery({ exam_id: examId });
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const shouldReduceMotion = useReducedMotion();

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
        if (rank === 1) return "bg-yellow-500/10 border-yellow-500/30";
        if (rank === 2) return "bg-gray-400/10 border-gray-400/30";
        if (rank === 3) return "bg-amber-600/10 border-amber-600/30";
        return isDark ? "bg-bg-tertiary-dark border-border-dark" : "bg-bg-tertiary-light border-border-light";
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const sortedLeaderboard = useMemo(() => {
        if (!data?.leaderboard) return [];
        let items = [...data.leaderboard];
        if (sortField) {
            items.sort((a: any, b: any) => {
                const aVal = a[sortField];
                const bVal = b[sortField];
                if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
                if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [data, sortField, sortOrder]);

    if (isLoading) {
        if (isLoading) {
            return <PageLoader variant="inline" size="md" message="Syncing Leaderboard..." className="py-16" />;
        }
    }

    if (error || !data) {
        return (
            <div className={`max-w-2xl mx-auto p-8 rounded-2xl border-2 text-center ${isDark ? "bg-red-900/5 border-red-500/20" : "bg-red-50/50 border-red-200"}`}>
                <p className={`text-lg font-bold ${isDark ? "text-red-400" : "text-red-600"}`}>Failed to sync leaderboard</p>
                <p className={`text-sm mt-2 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>We encountered an issue fetching the latest results. Please try again.</p>
            </div>
        );
    }

    const { leaderboard, currentUserRank, totalParticipants } = data;
    const top30 = sortedLeaderboard.slice(0, 30);
    const currentUserEntry = leaderboard.find(entry => entry.rank === currentUserRank);
    const showCurrentUserSeparately = currentUserRank !== null && currentUserRank > 30 && currentUserEntry;

    const containerVariants = {
        visible: {
            transition: {
                staggerChildren: 0.05,
            },
        }
    };

    const rowVariants = {
        hidden: {
            opacity: 0,
            y: 10,
            filter: "blur(4px)"
        },
        visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                type: "spring" as const,
                stiffness: 400,
                damping: 30,
            },
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Widget */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-3xl border ${isDark ? "bg-bg-secondary-dark/40 border-border-dark backdrop-blur-md" : "bg-white border-border-light shadow-sm"} relative overflow-hidden`}
            >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Trophy size={120} />
                </div>

                <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-yellow-500 border shrink-0 ${isDark ? "bg-yellow-500/10 border-yellow-500/20" : "bg-yellow-50 border-yellow-200"}`}>
                            <Trophy size={28} />
                        </div>
                        <div>
                            <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                Daily Leaderboard
                            </h2>
                            <p className={`text-sm font-medium ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                <span className={isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}>{totalParticipants}</span> participants
                            </p>
                        </div>
                    </div>

                    {currentUserRank !== null && (
                        <div className={`px-5 py-3 rounded-2xl border ml-auto sm:ml-0 ${isDark ? "bg-brand-primary-dark/10 border-brand-primary-dark/20" : "bg-brand-primary-light/5 border-brand-primary-light/20"}`}>
                            <p className={`text-[10px] uppercase tracking-widest font-bold opacity-60 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                Your Standing
                            </p>
                            <p className={`text-2xl sm:text-3xl font-black ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`}>
                                #{currentUserRank}
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Main Table */}
            <div className={`rounded-3xl border overflow-hidden ${isDark ? "bg-bg-secondary-dark/30 border-border-dark backdrop-blur-sm" : "bg-white border-border-light shadow-md"}`}>
                <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                    <div className="min-w-[800px]">
                        {/* Table Header */}
                        <div className={`grid grid-cols-12 gap-4 px-8 py-5 text-sm font-bold uppercase tracking-wider border-b ${isDark ? "bg-white/5 border-white/10 text-text-secondary-dark" : "bg-gray-50/50 border-gray-100 text-text-secondary-light"}`}>
                            <div className="col-span-1 flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => handleSort("rank")}>
                                Rank <ChevronDown size={10} className={`transition-transform ${sortField === "rank" && sortOrder === "desc" ? "rotate-180" : ""}`} />
                            </div>
                            <div className="col-span-1"></div> {/* Avatar Spacer */}
                            <div className="col-span-4">Participants</div>
                            <div className="col-span-3 text-center flex items-center justify-center gap-2 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => handleSort("accuracy")}>
                                Precision <ChevronDown size={10} className={`transition-transform ${sortField === "accuracy" && sortOrder === "desc" ? "rotate-180" : ""}`} />
                            </div>
                            <div className="col-span-3 text-right flex items-center justify-end gap-2 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => handleSort("time_taken_seconds")}>
                                Duration <ChevronDown size={10} className={`transition-transform ${sortField === "time_taken_seconds" && sortOrder === "desc" ? "rotate-180" : ""}`} />
                            </div>
                        </div>

                        {/* Staggered Rows */}
                        <motion.div
                            variants={!shouldReduceMotion ? containerVariants : {}}
                            initial="hidden"
                            animate="visible"
                            className="divide-y divide-white/5"
                        >
                            <AnimatePresence mode="popLayout">
                                {top30.map((entry) => (
                                    <motion.div
                                        key={entry.user_id}
                                        variants={!shouldReduceMotion ? rowVariants : {}}
                                        layout
                                        className={`grid grid-cols-12 gap-4 px-8 py-4 items-center group cursor-pointer transition-all ${entry.rank === currentUserRank ? (isDark ? "bg-brand-primary-dark/10" : "bg-brand-primary-light/5") : (isDark ? "hover:bg-white/5" : "hover:bg-gray-50")}`}
                                    >
                                        <div className="col-span-1">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border transition-transform group-hover:scale-110 ${getRankBg(entry.rank)} ${getRankColor(entry.rank)}`}>
                                                {entry.rank <= 3 ? <Trophy size={18} /> : <span>#{entry.rank}</span>}
                                            </div>
                                        </div>

                                        <div className="col-span-1 flex justify-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isDark ? "bg-bg-tertiary-dark border-white/10" : "bg-gray-100 border-white"}`}>
                                                <UserCircle size={24} className="opacity-40" />
                                            </div>
                                        </div>

                                        <div className="col-span-4 min-w-0">
                                            <p className={`font-bold truncate ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                                {entry.username || "Anonymous Scout"}
                                            </p>
                                            {entry.rank === currentUserRank && (
                                                <span className={`text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md ${isDark ? "bg-brand-primary-dark/20 text-brand-primary-dark" : "bg-brand-primary-light/20 text-brand-primary-light"}`}>
                                                    You
                                                </span>
                                            )}
                                        </div>

                                        <div className="col-span-3 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5">
                                                <HelpCircle className="text-blue-500" size={12} />
                                                <span className={`font-mono font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                                    {entry.accuracy.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="col-span-3 text-right">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/5">
                                                <span className={`font-mono text-sm font-medium ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                                                    {formatTime(entry.time_taken_seconds)}
                                                </span>
                                                <Clock className="text-orange-500" size={12} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Bottom Current User Entry (if sticky/separate) */}
            {showCurrentUserSeparately && currentUserEntry && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-3xl p-1 border-2 ${isDark ? "bg-brand-primary-dark/20 border-brand-primary-dark/30" : "bg-white border-brand-primary-light shadow-xl"}`}
                >
                    <div className="grid grid-cols-12 gap-4 px-7 py-4 items-center">
                        <div className="col-span-1">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-brand-primary-light text-white border border-brand-primary-dark/20`}>
                                #{currentUserEntry.rank}
                            </div>
                        </div>
                        <div className="col-span-1 flex justify-center">
                            <div className="w-10 h-10 rounded-full bg-brand-primary-light/20 flex items-center justify-center">
                                <UserCircle size={24} className="text-brand-primary-light" />
                            </div>
                        </div>
                        <div className="col-span-4">
                            <p className={`font-black uppercase tracking-tight ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                Your Current Rank
                            </p>
                        </div>
                        <div className="col-span-3 text-center">
                            <span className={`font-black text-xl ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                {currentUserEntry.accuracy.toFixed(1)}%
                            </span>
                        </div>
                        <div className="col-span-3 text-right text-sm font-bold opacity-60">
                            {formatTime(currentUserEntry.time_taken_seconds)}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default DailyLeaderboard;
