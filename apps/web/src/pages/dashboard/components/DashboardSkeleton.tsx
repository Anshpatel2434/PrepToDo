import React from "react";

interface SkeletonProps {
    className?: string;
}

const SkeletonRect: React.FC<SkeletonProps> = ({ className = "" }) => (
    <div
        className={`animate-pulse rounded-2xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark ${className}`}
    />
);

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* User Details Skeleton */}
            <div className="rounded-2xl border p-6 bg-bg-secondary-light dark:bg-bg-secondary-dark border-border-light dark:border-border-dark">
                <div className="flex items-center gap-4 mb-6">
                    <SkeletonRect className="w-14 h-14 rounded-2xl" />
                    <div className="space-y-2 flex-1">
                        <SkeletonRect className="h-6 w-48 rounded-lg" />
                        <SkeletonRect className="h-4 w-64 rounded-lg" />
                    </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <SkeletonRect key={i} className="h-24 rounded-2xl" />
                    ))}
                </div>
            </div>

            {/* Main Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Skill Proficiency Skeleton */}
                <div className="rounded-2xl border p-6 bg-bg-secondary-light dark:bg-bg-secondary-dark border-border-light dark:border-border-dark">
                    <SkeletonRect className="h-6 w-40 rounded-lg mb-2" />
                    <SkeletonRect className="h-4 w-64 rounded-lg mb-6" />
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between">
                                    <SkeletonRect className="h-4 w-32 rounded-lg" />
                                    <SkeletonRect className="h-4 w-12 rounded-lg" />
                                </div>
                                <SkeletonRect className="h-2 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Genre Performance Skeleton */}
                <div className="rounded-2xl border p-6 bg-bg-secondary-light dark:bg-bg-secondary-dark border-border-light dark:border-border-dark">
                    <SkeletonRect className="h-6 w-40 rounded-lg mb-2" />
                    <SkeletonRect className="h-4 w-56 rounded-lg mb-6" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <SkeletonRect key={i} className="h-28 rounded-2xl" />
                        ))}
                    </div>
                </div>

                {/* WPM/Accuracy Skeleton */}
                <div className="rounded-2xl border p-6 bg-bg-secondary-light dark:bg-bg-secondary-dark border-border-light dark:border-border-dark">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-2">
                            <SkeletonRect className="h-6 w-40 rounded-lg" />
                            <SkeletonRect className="h-4 w-56 rounded-lg" />
                        </div>
                        <div className="flex gap-2">
                            <SkeletonRect className="h-8 w-20 rounded-lg" />
                            <SkeletonRect className="h-8 w-16 rounded-lg" />
                        </div>
                    </div>
                    <SkeletonRect className="h-56 w-full rounded-xl" />
                </div>

                {/* Recommendations Skeleton */}
                <div className="rounded-2xl border p-6 bg-bg-secondary-light dark:bg-bg-secondary-dark border-border-light dark:border-border-dark">
                    <SkeletonRect className="h-6 w-32 rounded-lg mb-2" />
                    <SkeletonRect className="h-4 w-64 rounded-lg mb-6" />
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <SkeletonRect key={i} className="h-20 rounded-xl" />
                        ))}
                    </div>
                    <SkeletonRect className="h-16 w-full rounded-xl mt-6" />
                </div>
            </div>
        </div>
    );
};
