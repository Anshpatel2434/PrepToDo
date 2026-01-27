import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../../context/ThemeContext";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { useFetchUserQuery } from "../../auth/redux_usecases/authApi";
import type { UUID } from "../../../types";
import {
    useFetchUserAnalyticsQuery,
    useFetchUserMetricProficiencyQuery,
    useFetchUserProfileQuery,
    useFetchUserProficiencySignalsQuery,
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

    const userId = (user?.id ?? null) as UUID | null;

    const analyticsQuery = useFetchUserAnalyticsQuery(userId as UUID, {
        skip: !userId,
    });
    const metricQuery = useFetchUserMetricProficiencyQuery(userId as UUID, {
        skip: !userId,
    });
    const signalsQuery = useFetchUserProficiencySignalsQuery(userId as UUID, {
        skip: !userId,
    });
    const profileQuery = useFetchUserProfileQuery(userId as UUID, {
        skip: !userId,
    });

    const metricProficiency = metricQuery.data ?? [];

    const coreMetrics = metricProficiency.filter(
        (m) => m.dimension_type === "core_metric"
    );
    const genres = metricProficiency.filter((m) => m.dimension_type === "genre");

    return (
        <div className={`min-h-screen relative ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
            {/* Subtle background gradient */}
            <div className={`absolute inset-0 pointer-events-none ${isDark
                ? "bg-gradient-to-br from-brand-primary-dark/3 via-transparent to-brand-accent-dark/3"
                : "bg-gradient-to-br from-brand-primary-light/3 via-transparent to-brand-accent-light/3"
                }`} />

            <FloatingThemeToggle />
            <FloatingNavigation />

            <div className="min-h-screen overflow-x-hidden pl-18 sm:pl-20 md:pl-24 pr-3 sm:pr-4 md:pr-6 lg:pr-8 py-4 sm:py-6 md:py-10 relative z-10 pb-20 sm:pb-24">


                {!userId && isUserLoading ? (
                    <DashboardSkeleton />
                ) : !userId ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`max-w-md p-8 rounded-2xl border text-center ${isDark
                            ? "bg-bg-secondary-dark border-border-dark text-text-secondary-dark"
                            : "bg-bg-secondary-light border-border-light text-text-secondary-light"
                            }`}
                    >
                        <div className={`text-4xl mb-4 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
                            📊
                        </div>
                        <div className="font-medium mb-2">Sign in required</div>
                        <div className="text-sm">Please sign in to view your analytics dashboard.</div>
                    </motion.div>
                ) : (
                    <div className="space-y-4 sm:space-y-6 max-w-7xl">
                        {/* Zone 1: User Stats */}
                        <UserDetailsWidget
                            profile={profileQuery.data}
                            analytics={analyticsQuery.data}
                            isLoadingProfile={profileQuery.isLoading || profileQuery.isFetching}
                            isLoadingAnalytics={analyticsQuery.isLoading || analyticsQuery.isFetching}
                            isDark={isDark}
                        />

                        {/* Zone 2: Performance Overview (Skills + Genres) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <SkillRadarWidget
                                coreMetrics={coreMetrics}
                                isLoading={metricQuery.isLoading || metricQuery.isFetching}
                                isDark={isDark}
                                index={0}
                                error={metricQuery.error}
                            />

                            <GenreHeatmapWidget
                                genres={genres}
                                isLoading={metricQuery.isLoading || metricQuery.isFetching}
                                isDark={isDark}
                                index={1}
                                error={metricQuery.error}
                            />
                        </div>

                        {/* Zone 3: Trends + Actions (Charts + Recommendations) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <WPMAccuracyWidget
                                metrics={metricProficiency}
                                isLoading={metricQuery.isLoading || metricQuery.isFetching}
                                isDark={isDark}
                                index={2}
                                error={metricQuery.error}
                            />

                            <RecommendationWidget
                                signals={signalsQuery.data}
                                isLoading={signalsQuery.isLoading || signalsQuery.isFetching}
                                isDark={isDark}
                                index={3}
                                error={signalsQuery.error}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
