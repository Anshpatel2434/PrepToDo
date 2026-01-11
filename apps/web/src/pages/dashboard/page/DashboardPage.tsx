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
import { LogicGapWidget } from "../components/LogicGapWidget";
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
        <div className={`min-h-screen ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
            <FloatingThemeToggle />
            <FloatingNavigation />

            <div className="container mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10"
                >
                    <h1
                        className={`font-serif font-bold text-3xl md:text-5xl mb-3 ${
                            isDark
                                ? "text-text-primary-dark"
                                : "text-text-primary-light"
                        }`}
                    >
                        Your Analytics Dashboard
                    </h1>
                    <p
                        className={`text-base md:text-lg max-w-2xl mx-auto ${
                            isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                        }`}
                    >
                        Track your progress, spot weaknesses, and practice smarter.
                    </p>
                </motion.div>

                {!userId && isUserLoading ? (
                    <DashboardSkeleton />
                ) : !userId ? (
                    <div
                        className={`max-w-xl mx-auto p-6 rounded-2xl border text-center ${
                            isDark
                                ? "bg-bg-secondary-dark border-border-dark text-text-secondary-dark"
                                : "bg-bg-secondary-light border-border-light text-text-secondary-light"
                        }`}
                    >
                        Please sign in to view your analytics dashboard.
                    </div>
                ) : (
                    <div className="space-y-6">
                        <UserDetailsWidget
                            profile={profileQuery.data}
                            analytics={analyticsQuery.data}
                            isLoadingProfile={profileQuery.isLoading || profileQuery.isFetching}
                            isLoadingAnalytics={
                                analyticsQuery.isLoading || analyticsQuery.isFetching
                            }
                            isDark={isDark}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[minmax(220px,_auto)]">
                            <SkillRadarWidget
                                coreMetrics={coreMetrics}
                                isLoading={metricQuery.isLoading || metricQuery.isFetching}
                                isDark={isDark}
                                index={0}
                                error={metricQuery.error}
                                className="md:col-span-2 md:row-span-2"
                            />

                            <GenreHeatmapWidget
                                genres={genres}
                                isLoading={metricQuery.isLoading || metricQuery.isFetching}
                                isDark={isDark}
                                index={1}
                                error={metricQuery.error}
                                className="md:col-span-2"
                            />

                            <LogicGapWidget
                                metricProficiency={metricProficiency}
                                isLoading={metricQuery.isLoading || metricQuery.isFetching}
                                isDark={isDark}
                                index={2}
                                error={metricQuery.error}
                                className="md:col-span-2 md:row-span-2"
                            />

                            <WPMAccuracyWidget
                                metrics={metricProficiency}
                                isLoading={
                                    metricQuery.isLoading || metricQuery.isFetching
                                }
                                isDark={isDark}
                                index={3}
                                error={metricQuery.error}
                                className="md:col-span-3"
                            />

                            <RecommendationWidget
                                signals={signalsQuery.data}
                                isLoading={
                                    signalsQuery.isLoading || signalsQuery.isFetching
                                }
                                isDark={isDark}
                                index={4}
                                error={signalsQuery.error}
                                className="md:col-span-3"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
