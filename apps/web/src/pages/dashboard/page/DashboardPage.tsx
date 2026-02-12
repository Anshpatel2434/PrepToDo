import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../../context/ThemeContext";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { useFetchUserQuery } from "../../auth/redux_usecases/authApi";
import {
    useFetchDashboardDataQuery,
} from "../redux_usecases/dashboardApi";
import { DashboardSkeleton } from "../components/DashboardSkeleton";
import { SkillRadarWidget } from "../components/SkillRadarWidget";
import { GenreHeatmapWidget } from "../components/GenreHeatmapWidget";
import { WPMAccuracyWidget } from "../components/WPMAccuracyWidget";
import { RecommendationWidget } from "../components/RecommendationWidget";
import { UserDetailsWidget } from "../components/UserDetailsWidget";

export const DashboardPage: React.FC = () => {
    const { isDark } = useTheme();
    const { data: user, isLoading: isUserLoading } = useFetchUserQuery();

    // Use the combined dashboard data endpoint (single request, more efficient)
    const dashboardQuery = useFetchDashboardDataQuery(undefined, {
        skip: !user?.id,
    });

    const metricProficiency = dashboardQuery.data?.metricProficiency ?? [];

    const coreMetrics = metricProficiency.filter(
        (m) => m.dimension_type === "core_metric"
    );
    const genres = metricProficiency.filter((m) => m.dimension_type === "genre");

    return (
        <div className={`min-h-screen relative ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
            {/* Subtle background gradient */}
            <div className={`absolute inset-0 pointer-events-none ${isDark
                ? "bg-linear-to-br from-brand-primary-dark/5 via-transparent to-brand-accent-dark/5"
                : "bg-linear-to-br from-brand-primary-light/5 via-transparent to-brand-accent-light/5"
                }`} />

            <FloatingThemeToggle />
            <FloatingNavigation />

            <div className="min-h-screen overflow-x-hidden px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 pb-20 sm:pb-24 relative z-10">


                {!user?.id && isUserLoading ? (
                    <DashboardSkeleton />
                ) : !user?.id ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`max-w-xl p-10 rounded-3xl border text-center backdrop-blur-md ${isDark
                            ? "bg-bg-secondary-dark/50 border-white/5 text-text-secondary-dark"
                            : "bg-white/50 border-black/5 text-text-secondary-light"
                            }`}
                    >
                        <div className={`text-6xl mb-6 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
                            📊
                        </div>
                        <div className="font-bold text-3xl mb-4 tracking-tight">Unlock Deep Performance Insights</div>
                        <div className="text-lg leading-relaxed opacity-80">Sign in to access AI-driven diagnostics, track your improved reasoning skills, and visualize your growth across core VARC metrics.</div>
                    </motion.div>
                ) : (
                <div className="space-y-4 sm:space-y-5 max-w-400 mx-auto">
                    {/* Row 1: User Details (left - smaller) + Skill Radar (right - larger) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                        <div className="lg:col-span-5">
                            <UserDetailsWidget
                                profile={dashboardQuery.data?.profile}
                                analytics={dashboardQuery.data?.analytics}
                                isLoadingProfile={dashboardQuery.data ? false : true}
                                isLoadingAnalytics={dashboardQuery.data ? false : true}
                                isDark={isDark}
                            />
                        </div>

                        <div className="lg:col-span-7">
                            <SkillRadarWidget
                                coreMetrics={coreMetrics}
                                isLoading={dashboardQuery.data ? false : true}
                                isDark={isDark}
                                index={0}
                                error={dashboardQuery.error}
                            />
                        </div>
                    </div>

                    {/* Row 2: Genre Performance (left) + WPM vs Accuracy (right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        <GenreHeatmapWidget
                            genres={genres}
                            isLoading={dashboardQuery.data ? false : true}
                            isDark={isDark}
                            index={1}
                            error={dashboardQuery.error}
                        />

                        <WPMAccuracyWidget
                            metrics={metricProficiency}
                            isLoading={dashboardQuery.data ? false : true}
                            isDark={isDark}
                            index={2}
                            error={dashboardQuery.error}
                        />
                    </div>

                    {/* Row 3: Recommendations (full width) */}
                    <RecommendationWidget
                        signals={dashboardQuery.data?.proficiencySignals}
                        metricProficiency={metricProficiency}
                        isLoading={dashboardQuery.data ? false : true}
                        isDark={isDark}
                        index={3}
                        error={dashboardQuery.error}
                    />
                </div>
                )}
            </div>
        </div>
    );
};
