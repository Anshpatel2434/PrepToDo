import React from "react";

interface SkeletonProps {
    className?: string;
}

const SkeletonRect: React.FC<SkeletonProps> = ({ className = "" }) => (
    <div
        className={`animate-pulse rounded-md bg-bg-tertiary-light dark:bg-bg-tertiary-dark bg-opacity-60 ${className}`}
    />
);

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* User Details Skeleton */}
            <SkeletonRect className="h-28 w-full rounded-2xl" />

            {/* Bento Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[minmax(220px,_auto)]">
                {/* Widget 1: Tall */}
                <SkeletonRect className="md:col-span-2 md:row-span-2 rounded-xl" />

                {/* Widget 2: Standard */}
                <SkeletonRect className="md:col-span-2 rounded-xl" />

                {/* Widget 3: Tall */}
                <SkeletonRect className="md:col-span-2 md:row-span-2 rounded-xl" />

                {/* Widget 4: Wide */}
                <SkeletonRect className="md:col-span-3 rounded-xl" />

                {/* Widget 5: Wide */}
                <SkeletonRect className="md:col-span-3 rounded-xl" />
            </div>
        </div>
    );
};
