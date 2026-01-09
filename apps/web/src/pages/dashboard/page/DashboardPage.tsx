import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../context/ThemeContext";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { DashboardHeader } from "../components/DashboardHeader";
import { SummaryCards } from "../components/SummaryCards";
import { ActivityHeatmap } from "../components/ActivityHeatmap";
import { ProgressChart } from "../components/ProgressChart";
import { DashboardSkeleton } from "../components/SkeletonLoader";
import { SkillRadar } from "../components/SkillRadar";
import { GenreHeatmap } from "../components/GenreHeatmap";
import { LogicGapPanel } from "../components/LogicGapPanel";
import { WpmAccuracyChart } from "../components/WpmAccuracyChart";
import { RecommendationsWidget } from "../components/RecommendationsWidget";
import { 
    useFetchUserAnalyticsQuery, 
    useFetchUserProficiencyQuery, 
    useFetchUserSignalsQuery, 
    useFetchRecentSessionsQuery 
} from "../redux_usecases/dashboardApi";
import { supabase } from "../../../services/apiClient";
import { Globe, Lock, Smartphone, Zap, Target, Brain, BarChart3, TrendingUp } from "lucide-react";

export const DashboardPage: React.FC = () => {
    const { isDark } = useTheme();
    const [userId, setUserId] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data: profile } = await supabase
                    .from("user_profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();
                setUserProfile(profile);
            }
        };
        getUser();
    }, []);

    const { data: analyticsList, isLoading: analyticsLoading } = useFetchUserAnalyticsQuery(userId!, { skip: !userId });
    const { data: proficiency, isLoading: proficiencyLoading } = useFetchUserProficiencyQuery(userId!, { skip: !userId });
    const { data: signals, isLoading: signalsLoading } = useFetchUserSignalsQuery(userId!, { skip: !userId });
    const { data: sessions, isLoading: sessionsLoading } = useFetchRecentSessionsQuery(userId!, { skip: !userId });

    const isLoading = analyticsLoading || proficiencyLoading || signalsLoading || sessionsLoading || !userId;

    const latestAnalytics = useMemo(() => {
        if (!analyticsList || analyticsList.length === 0) return null;
        return analyticsList[0];
    }, [analyticsList]);
    
    // For ProgressChart and ActivityHeatmap, we might need more history
    // But for now let's use what we have or adjust queries if needed.
    // The current queries fetch latest or all.
    
    const analyticsForHeatmap = useMemo(() => {
        return analyticsList || [];
    }, [analyticsList]);

    return (
        <div
            className={`min-h-screen ${
                isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
            }`}
        >
            <FloatingThemeToggle />
            <FloatingNavigation />

            <AnimatePresence mode="wait">
                {isLoading ? (
                    <DashboardSkeleton key="skeleton" />
                ) : (
                    <motion.main
                        key="content"
                        className="pt-24 pb-10 px-4 sm:px-6 lg:px-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div className="mx-auto max-w-7xl space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: 0.1 }}
                            >
                                <DashboardHeader userProfile={userProfile} isDark={isDark} />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: 0.2 }}
                            >
                                <SummaryCards 
                                    analytics={analyticsList || []} 
                                    sessions={sessions || []} 
                                    isDark={isDark} 
                                />
                            </motion.div>

                            {/* Bento Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[240px]">
                                
                                {/* 1. Skill Radar - Tall (2x2) */}
                                <motion.div
                                    className={`md:col-span-2 md:row-span-2 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-6 flex flex-col hover:border-zinc-700 transition-colors shadow-sm`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Target className="w-5 h-5 text-blue-500" />
                                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Skill Radar</h3>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <SkillRadar data={proficiency || []} isDark={isDark} />
                                    </div>
                                </motion.div>

                                {/* 2. Logic Gap Panel - Standard (2x1) */}
                                <motion.div
                                    className={`md:col-span-2 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-6 flex flex-col hover:border-zinc-700 transition-colors shadow-sm overflow-hidden`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Brain className="w-5 h-5 text-amber-500" />
                                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Logic Gaps</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        <LogicGapPanel data={proficiency || []} isDark={isDark} />
                                    </div>
                                </motion.div>

                                {/* 3. Recommendations - Tall (2x2) */}
                                <motion.div
                                    className={`md:col-span-2 md:row-span-2 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-6 flex flex-col hover:border-zinc-700 transition-colors shadow-sm`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <RecommendationsWidget signals={signals} isDark={isDark} />
                                </motion.div>

                                {/* 4. WPM vs Accuracy - Standard (2x1) */}
                                <motion.div
                                    className={`md:col-span-2 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-6 flex flex-col hover:border-zinc-700 transition-colors shadow-sm`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Zap className="w-5 h-5 text-yellow-500" />
                                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>WPM vs Accuracy</h3>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <WpmAccuracyChart data={sessions || []} isDark={isDark} />
                                    </div>
                                </motion.div>

                                {/* 5. Genre Heatmap - Wide (3x1) */}
                                <motion.div
                                    className={`md:col-span-3 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-6 flex flex-col hover:border-zinc-700 transition-colors shadow-sm`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <BarChart3 className="w-5 h-5 text-green-500" />
                                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Genre Proficiency</h3>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <GenreHeatmap data={proficiency || []} isDark={isDark} />
                                    </div>
                                </motion.div>

                                {/* 6. Progress Chart - Wide (3x1) */}
                                <motion.div
                                    className={`md:col-span-3 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-6 flex flex-col hover:border-zinc-700 transition-colors shadow-sm`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp className="w-5 h-5 text-blue-400" />
                                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Performance Trend</h3>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <ProgressChart analytics={analyticsList || []} isDark={isDark} />
                                    </div>
                                </motion.div>

                            </div>

                            {/* Bottom row: Heatmap */}
                            <motion.div
                                className={`w-full ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-sm`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.6 }}
                            >
                                <ActivityHeatmap analytics={analyticsList || []} isDark={isDark} weeks={20} />
                            </motion.div>
                        </div>
                    </motion.main>
                )}
            </AnimatePresence>
        </div>
    );
};
