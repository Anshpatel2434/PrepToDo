import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { MdMenuBook, MdSpellcheck, MdLeaderboard, MdChevronDown } from "react-icons/md";

// Leaderboard Content Component
const LeaderboardContent: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    // Generate mock leaderboard data locally
    const generateLeaderboard = () => {
        const entries = [];
        for (let i = 1; i <= 30; i++) {
            entries.push({
                rank: i,
                username: `user_${1000 + i}`,
                accuracy: 90 - Math.floor(Math.random() * 30),
                timeTaken: Math.floor(300 + Math.random() * 600),
                questionsAttempted: 10 - Math.floor(Math.random() * 3),
            });
        }
        return entries;
    };

    const [leaderboard] = useState(generateLeaderboard());
    const currentUserRank = 45; // Mock current user rank > 30

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium mb-2 px-4">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">User</div>
                <div className="col-span-2 text-center">Accuracy</div>
                <div className="col-span-2 text-center">Time</div>
                <div className="col-span-3 text-center">Attempts</div>
            </div>

            {leaderboard.slice(0, 30).map((entry) => (
                <div
                    key={entry.rank}
                    className={`
                        grid grid-cols-12 gap-4 p-3 rounded-lg
                        ${isDark
                            ? "bg-bg-tertiary-dark hover:bg-bg-secondary-dark"
                            : "bg-bg-tertiary-light hover:bg-bg-secondary-light"
                        }
                    `}
                >
                    <div className="col-span-1 flex items-center font-mono font-bold">
                        {entry.rank === 1 && "🥇"}
                        {entry.rank === 2 && "🥈"}
                        {entry.rank === 3 && "🥉"}
                        {entry.rank > 3 && `#${entry.rank}`}
                    </div>
                    <div className="col-span-4 flex items-center font-medium truncate">
                        {entry.username}
                    </div>
                    <div
                        className={`col-span-2 flex items-center justify-center font-semibold ${
                            entry.accuracy >= 80
                                ? "text-success"
                                : entry.accuracy >= 60
                                ? "text-warning"
                                : "text-error"
                        }`}
                    >
                        {entry.accuracy}%
                    </div>
                    <div className="col-span-2 flex items-center justify-center font-mono text-sm">
                        {formatTime(entry.timeTaken)}
                    </div>
                    <div className="col-span-3 flex items-center justify-center font-semibold">
                        {entry.questionsAttempted}/10
                    </div>
                </div>
            ))}

            {currentUserRank > 30 && (
                <>
                    <div
                        className={`text-center py-2 text-sm font-medium ${
                            isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}
                    >
                        ...
                    </div>
                    <div
                        className={`
                            grid grid-cols-12 gap-4 p-3 rounded-lg
                            ${
                                isDark
                                    ? "bg-brand-primary-dark/20 border border-brand-primary-dark"
                                    : "bg-brand-primary-light/20 border border-brand-primary-light"
                            }
                        `}
                    >
                        <div className="col-span-1 flex items-center font-mono font-bold">
                            #{currentUserRank}
                        </div>
                        <div className="col-span-4 flex items-center font-medium">
                            You
                        </div>
                        <div className="col-span-2 flex items-center justify-center font-semibold text-success">
                            75%
                        </div>
                        <div className="col-span-2 flex items-center justify-center font-mono text-sm">
                            {formatTime(420)}
                        </div>
                        <div className="col-span-3 flex items-center justify-center font-semibold">
                            8/10
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const DailyPage: React.FC = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [dailyContext, setDailyContext] = useState<{
        genre: string;
        articleTitle: string;
        articleLink: string;
    } | null>(null);

    // Fetch daily test context
    useEffect(() => {
        // This would fetch from API - for now, showing mock data
        setDailyContext({
            genre: "Science & Technology",
            articleTitle: "The Future of Artificial Intelligence in Healthcare",
            articleLink: "https://example.com/article",
        });
    }, []);

    const handleStartPractice = async (type: "rc" | "va") => {
        console.log("[DailyPage] handleStartPractice called for type:", type);
        navigate(`/daily/${type}`);
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
                    className="text-center mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex-1" />
                        <h1
                            className={`
                                font-serif font-bold text-3xl md:text-5xl
                                ${
                                    isDark
                                        ? "text-text-primary-dark"
                                        : "text-text-primary-light"
                                }
                            `}
                        >
                            Daily Practice
                        </h1>
                        <div className="flex-1 flex justify-end">
                            <motion.button
                                onClick={() => setShowLeaderboard(!showLeaderboard)}
                                className={`
                                    px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2
                                    transition-all duration-200
                                    ${
                                        showLeaderboard
                                            ? isDark
                                                ? "bg-brand-primary-dark text-white"
                                                : "bg-brand-primary-light text-white"
                                            : isDark
                                            ? "bg-bg-secondary-dark text-text-primary-dark hover:bg-bg-tertiary-dark"
                                            : "bg-bg-secondary-light text-text-primary-light hover:bg-bg-tertiary-light"
                                    }
                                `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <MdLeaderboard />
                                <span className="hidden sm:inline">Leaderboard</span>
                            </motion.button>
                        </div>
                    </div>
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

                {/* Daily Context Section */}
                {dailyContext && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className={`
                            max-w-4xl mx-auto p-6 rounded-xl border mb-8
                            ${
                                isDark
                                    ? "bg-bg-secondary-dark border-border-dark"
                                    : "bg-bg-secondary-light border-border-light"
                            }
                        `}
                    >
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-1">
                                <div
                                    className={`text-sm font-medium mb-2 ${
                                        isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                    }`}
                                >
                                    📚 Target Genre
                                </div>
                                <div
                                    className={`text-lg font-semibold ${
                                        isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                    }`}
                                >
                                    {dailyContext.genre}
                                </div>
                            </div>
                            <div className="flex-1">
                                <div
                                    className={`text-sm font-medium mb-2 ${
                                        isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                    }`}
                                >
                                    📰 Article Fetched
                                </div>
                                <div
                                    className={`text-lg font-semibold mb-2 ${
                                        isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                    }`}
                                >
                                    {dailyContext.articleTitle}
                                </div>
                                <a
                                    href={dailyContext.articleLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-sm font-medium inline-flex items-center gap-1 hover:underline ${
                                        isDark
                                            ? "text-brand-primary-dark"
                                            : "text-brand-primary-light"
                                    }`}
                                >
                                    Read Article →
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Leaderboard View */}
                <AnimatePresence>
                    {showLeaderboard && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mb-8 overflow-hidden"
                        >
                            <div
                                className={`
                                    max-w-4xl mx-auto p-6 rounded-xl border
                                    ${
                                        isDark
                                            ? "bg-bg-secondary-dark border-border-dark"
                                            : "bg-bg-secondary-light border-border-light"
                                    }
                                `}
                            >
                                <h3
                                    className={`font-semibold text-xl mb-6 ${
                                        isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                    }`}
                                >
                                    🏆 Daily Leaderboard
                                </h3>

                                {/* Leaderboard Content */}
                                <LeaderboardContent isDark={isDark} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Practice Options Grid */}
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
                    {practiceOptions.map((option, index) => {
                        const Icon = option.icon;
                        return (
                            <motion.button
                                key={option.id}
                                onClick={() => handleStartPractice(option.id as "rc" | "va")}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className={`
                                    relative overflow-hidden p-8 rounded-2xl
                                    border-2
                                    text-left group
                                    ${
                                        isDark
                                            ? "bg-bg-secondary-dark border-border-dark hover:border-brand-primary-dark"
                                            : "bg-bg-secondary-light border-border-light hover:border-brand-primary-light"
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
                                                ${
                                                    isDark
                                                        ? "bg-bg-tertiary-dark"
                                                        : "bg-bg-tertiary-light"
                                                }
                                            `}
                                        >
                                            <Icon className={`w-8 h-8 ${option.iconColor}`} />
                                        </div>
                                        <h2
                                            className={`
                                                font-serif font-bold text-xl md:text-2xl
                                                ${
                                                    isDark
                                                        ? "text-text-primary-dark"
                                                        : "text-text-primary-light"
                                                }
                                            `}
                                        >
                                            {option.title}
                                        </h2>
                                    </div>
                                    <p
                                        className={`
                                            leading-relaxed
                                            ${
                                                isDark
                                                    ? "text-text-secondary-dark"
                                                    : "text-text-secondary-light"
                                            }
                                        `}
                                    >
                                        {option.description}
                                    </p>

                                    {/* Arrow indicator or Loading */}
                                    <div className="mt-6 flex items-center gap-2">
                                        <span
                                            className={`text-sm font-medium ${
                                                isDark
                                                    ? "text-brand-primary-dark"
                                                    : "text-brand-primary-light"
                                            }`}
                                        >
                                            Start Practice
                                        </span>
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
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Previous Daily Tests */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className={`
                        max-w-4xl mx-auto mt-8 p-6 rounded-xl border
                        ${
                            isDark
                                ? "bg-bg-secondary-dark border-border-dark"
                                : "bg-bg-secondary-light border-border-light"
                        }
                    `}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3
                            className={`
                                font-semibold
                                ${
                                    isDark
                                        ? "text-text-primary-dark"
                                        : "text-text-primary-light"
                                }
                            `}
                        >
                            📅 Previous Daily Tests
                        </h3>
                        <motion.button
                            className={`
                                flex items-center gap-2 text-sm font-medium
                                ${
                                    isDark
                                        ? "text-brand-primary-dark hover:underline"
                                        : "text-brand-primary-light hover:underline"
                                }
                            `}
                            whileHover={{ scale: 1.02 }}
                        >
                            View All
                            <MdChevronDown />
                        </motion.button>
                    </div>

                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((day) => (
                            <motion.button
                                key={day}
                                onClick={() => navigate(`/daily/rc?exam_id=mock_exam_${day}&session_id=mock_session_${day}`)}
                                className={`
                                    w-full p-4 rounded-lg border text-left transition-all duration-200
                                    ${
                                        isDark
                                            ? "bg-bg-tertiary-dark border-border-dark hover:bg-bg-secondary-dark hover:border-brand-primary-dark"
                                            : "bg-bg-tertiary-light border-border-light hover:bg-bg-secondary-light hover:border-brand-primary-light"
                                    }
                                `}
                                whileHover={{ scale: 1.01, x: 4 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div
                                            className={`text-sm font-medium ${
                                                isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                            }`}
                                        >
                                            January {day + 10}, 2026
                                        </div>
                                        <div
                                            className={`text-xs mt-1 ${
                                                isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                            }`}
                                        >
                                            Daily Practice Challenge
                                        </div>
                                    </div>
                                    <div
                                        className={`text-sm font-semibold ${
                                            isDark
                                                ? "text-brand-primary-dark"
                                                : "text-brand-primary-light"
                                        }`}
                                    >
                                        Review →
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Info Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className={`
                        mt-12 max-w-2xl mx-auto p-6 rounded-xl border
                        ${
                            isDark
                                ? "bg-bg-secondary-dark border-border-dark"
                                : "bg-bg-secondary-light border-border-light"
                        }
                    `}
                >
                    <h3
                        className={`
                            font-semibold mb-3
                            ${
                                isDark
                                    ? "text-text-primary-dark"
                                    : "text-text-primary-light"
                            }
                        `}
                    >
                        📊 Practice Features
                    </h3>
                    <ul
                        className={`
                            space-y-2 text-sm
                            ${
                                isDark
                                    ? "text-text-secondary-dark"
                                    : "text-text-secondary-light"
                            }
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
