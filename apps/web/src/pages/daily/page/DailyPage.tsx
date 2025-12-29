import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { MdMenuBook, MdSpellcheck } from "react-icons/md";
import { useLazyFetchDailyTestDataQuery, useStartDailyRCSessionMutation, useStartDailyVASessionMutation, useLazyFetchExistingSessionDetailsQuery } from "../redux_usecase/dailyPracticeApi";
import { supabase } from "../../../services/apiClient";
import type { Question } from "../../../types";

const DailyPage: React.FC = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const [isStarting, setIsStarting] = useState(false);

    const [fetchDailyData] = useLazyFetchDailyTestDataQuery();
    const [startRCSession] = useStartDailyRCSessionMutation();
    const [startVASession] = useStartDailyVASessionMutation();
    const [fetchExistingSession] = useLazyFetchExistingSessionDetailsQuery();

    const handleStartPractice = async (type: 'rc' | 'va') => {
        setIsStarting(true);
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('User not authenticated');
                setIsStarting(false);
                return;
            }

            // Fetch daily test data
            const { data: testData } = await fetchDailyData();
            if (!testData) {
                console.error('Failed to fetch daily test data');
                setIsStarting(false);
                return;
            }

            // Check for existing session
            const sessionType = type === 'rc' ? 'daily_challenge_rc' : 'daily_challenge_va';
            const { data: existingSession, error: existingSessionError } = await fetchExistingSession({
                user_id: user.id,
                paper_id: testData.examInfo.id,
                session_type: sessionType,
            });

            if (existingSession && !existingSessionError) {
                // Resume existing session
                console.log('Resuming existing session:', existingSession.session.id);
                navigate(type === 'rc' ? '/daily/rc' : '/daily/va', {
                    state: {
                        sessionId: existingSession.session.id,
                        testData,
                        existingAttempts: existingSession.attempts,
                    }
                });
                return;
            }

            // Prepare passage and question IDs
            let passageIds: string[] = [];
            let questionIds: string[] = [];

            if (type === 'rc') {
                // Filter RC questions and get associated passage IDs
                const rcQuestions = testData.questions.filter((q: Question) =>
                    q.question_type === 'rc_question' || q.passage_id !== null
                );
                questionIds = rcQuestions.map((q: Question) => q.id);

                // Get unique passage IDs from RC questions
                const passageIdSet = new Set<string>();
                rcQuestions.forEach((q: Question) => {
                    if (q.passage_id) {
                        passageIdSet.add(q.passage_id);
                    }
                });
                passageIds = Array.from(passageIdSet);
            } else {
                // Filter VA questions (questions without passage_id)
                const vaQuestions = testData.questions.filter((q: Question) =>
                    q.passage_id === null && q.question_type !== 'rc_question'
                );
                questionIds = vaQuestions.map((q: Question) => q.id);
            }

            // Start appropriate session
            if (type === 'rc') {
                const { data: session } = await startRCSession({
                    user_id: user.id,
                    paper_id: testData.examInfo.id,
                    passage_ids: passageIds,
                    question_ids: questionIds,
                });
                if (session) {
                    navigate('/daily/rc', { state: { sessionId: session.id, testData } });
                }
            } else {
                const { data: session } = await startVASession({
                    user_id: user.id,
                    paper_id: testData.examInfo.id,
                    passage_ids: passageIds,
                    question_ids: questionIds,
                });
                if (session) {
                    navigate('/daily/va', { state: { sessionId: session.id, testData } });
                }
            }
        } catch (error) {
            console.error('Error starting practice:', error);
        } finally {
            setIsStarting(false);
        }
    };

    const practiceOptions = [
        {
            id: "rc",
            title: "Reading Comprehension",
            description: "Practice passage-based questions and improve your reading skills",
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
                    className="text-center mb-12"
                >
                    <h1
                        className={`
                            font-serif font-bold text-5xl mb-4
                            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                        `}
                    >
                        Daily Practice
                    </h1>
                    <p
                        className={`
                            text-lg max-w-2xl mx-auto
                            ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                        `}
                    >
                        Sharpen your skills with focused daily practice sessions. Choose your
                        area of focus below.
                    </p>
                </motion.div>

                {/* Practice Options Grid */}
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
                    {practiceOptions.map((option, index) => {
                        const Icon = option.icon;
                        return (
                            <motion.button
                                key={option.id}
                                onClick={() => handleStartPractice(option.id as 'rc' | 'va')}
                                disabled={isStarting}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                whileHover={!isStarting ? { scale: 1.02, y: -4 } : {}}
                                whileTap={!isStarting ? { scale: 0.98 } : {}}
                                className={`
                                    relative overflow-hidden p-8 rounded-2xl
                                    border-2 transition-all duration-300
                                    text-left group
                                    ${
                                        isDark
                                            ? "bg-bg-secondary-dark border-border-dark hover:border-brand-primary-dark"
                                            : "bg-bg-secondary-light border-border-light hover:border-brand-primary-light"
                                    }
                                    ${isStarting ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                {/* Gradient Background */}
                                <div
                                    className={`
                                        absolute inset-0 bg-gradient-to-br ${option.gradient}
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
                                                font-serif font-bold text-2xl
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
                                        {isStarting ? (
                                            <div className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded-full border-2 border-t-transparent animate-spin ${
                                                    isDark ? 'border-brand-primary-dark' : 'border-brand-primary-light'
                                                }`} />
                                                <span
                                                    className={`text-sm font-medium ${
                                                        isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                                    }`}
                                                >
                                                    Starting...
                                                </span>
                                            </div>
                                        ) : (
                                            <>
                                                <span
                                                    className={`text-sm font-medium ${
                                                        isDark ? "text-brand-primary-dark" : "text-brand-primary-light"
                                                    }`}
                                                >
                                                    Start Practice
                                                </span>
                                                <motion.span
                                                    className={`${
                                                        isDark ? "text-brand-primary-dark" : "text-brand-primary-light"
                                                    }`}
                                                    animate={{ x: [0, 4, 0] }}
                                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                                >
                                                    →
                                                </motion.span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Info Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
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
                            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
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
