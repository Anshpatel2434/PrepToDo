import React from "react";
import { motion } from "framer-motion";
import { SummaryCards } from "../components/SummaryCards";
import { ProgressChart } from "../components/ProgressChart";
import { StrengthWeakness } from "../components/StrengthWeakness";
import { NextSteps } from "../components/NextSteps";
import { SocialPreview } from "../components/SocialPreview";

export const DashboardPage: React.FC = () => {
    // Dummy data - clearly commented as placeholder
    // This structure matches what the real backend will provide
    const dummyData = {
        // TODO: Replace with actual backend data
        summary: {
            totalQuestions: 247,
            overallAccuracy: 73,
            totalMinutes: 185,
            currentStreak: 5,
        },
        progress: {
            weeklyTrend: [
                { week: "Week 1", accuracy: 68, questions: 45 },
                { week: "Week 2", accuracy: 71, questions: 52 },
                { week: "Week 3", accuracy: 69, questions: 48 },
                { week: "Week 4", accuracy: 73, questions: 61 },
            ],
        },
        strengthsWeaknesses: {
            strengths: [
                { topic: "Reading Comprehension", accuracy: 85 },
                { topic: "Tone Analysis", accuracy: 79 },
                { topic: "Grammar", accuracy: 81 },
            ],
            weaknesses: [
                { topic: "Vocabulary", accuracy: 62 },
                { topic: "Inference", accuracy: 65 },
                { topic: "Critical Reasoning", accuracy: 68 },
            ],
        },
        nextActions: [
            {
                action: "Practice weak topic",
                details: "Focus on Vocabulary - your lowest area",
                priority: "high" as const,
            },
            {
                action: "Daily Reading Comprehension",
                details: "Build on your strength with 2 passages",
                priority: "medium" as const,
            },
            {
                action: "Review missed questions",
                details: "Go through 12 questions you got wrong",
                priority: "medium" as const,
            },
        ],
        social: {
            peersPracticed: 234,
            studyGroupsAvailable: true,
            progressComparisonSoon: true,
        },
    };

    return (
        <div className="min-h-screen bg-bg-primary-light dark:bg-bg-primary-dark">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="border-b border-border-light dark:border-border-dark bg-bg-secondary-light dark:bg-bg-secondary-dark"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                        Your Learning Dashboard
                    </h1>
                    <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        Track your progress and discover what to focus on next
                    </p>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    {/* 1. TOP SUMMARY STRIP */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">📊 Your Progress Overview</h2>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Key metrics to understand your learning journey at a glance</p>
                        </div>
                        <SummaryCards data={dummyData.summary} />
                    </motion.section>

                    {/* 2. PROGRESS OVER TIME */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <ProgressChart data={dummyData.progress} />
                    </motion.section>

                    {/* 3. STRENGTHS & WEAKNESSES */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">💪 Strengths & Focus Areas</h2>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Understand where you excel and where to concentrate your efforts</p>
                        </div>
                        <StrengthWeakness data={dummyData.strengthsWeaknesses} />
                    </motion.section>

                    {/* 4. WHAT TO DO NEXT */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <NextSteps data={dummyData.nextActions} />
                    </motion.section>

                    {/* 5. SOCIAL PREVIEW */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <SocialPreview data={dummyData.social} />
                    </motion.section>
                </div>
            </main>
        </div>
    );
};