import React from "react";

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

const SkeletonRect: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-opacity-60 ${className}`} />
);

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-primary-light dark:bg-bg-primary-dark animate-fade-in">
      <div className="pt-24 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* User Card Skeleton */}
          <div className="dashboard-panel dashboard-panel-light dark:dashboard-panel-dark p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <SkeletonRect className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                <div className="space-y-2">
                  <SkeletonRect className="h-6 w-32 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                  <SkeletonRect className="h-4 w-24 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4">
                <div className="rounded-xl border border-border-light dark:border-border-dark px-3 py-2 bg-bg-tertiary-light/40 dark:bg-bg-tertiary-dark/40">
                  <SkeletonRect className="h-3 w-20 mb-1 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                  <SkeletonRect className="h-4 w-16 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                </div>
                <div className="rounded-xl border border-border-light dark:border-border-dark px-3 py-2 bg-bg-tertiary-light/40 dark:bg-bg-tertiary-dark/40">
                  <SkeletonRect className="h-3 w-12 mb-1 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                  <SkeletonRect className="h-4 w-12 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards Skeleton */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="dashboard-panel dashboard-panel-light dark:dashboard-panel-dark p-4"
              >
                <SkeletonRect className="h-4 w-32 mb-2 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                <SkeletonRect className="h-8 w-20 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
              </div>
            ))}
          </section>

          {/* Heatmap & Progress Chart Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <div className="dashboard-panel dashboard-panel-light dark:dashboard-panel-dark p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="space-y-2">
                    <SkeletonRect className="h-6 w-32 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                    <SkeletonRect className="h-4 w-48 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                  </div>
                  <div className="flex items-center gap-2">
                    <SkeletonRect className="h-4 w-12 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <SkeletonRect key={i} className="w-3 h-3 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                      ))}
                    </div>
                    <SkeletonRect className="h-4 w-12 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                  </div>
                </div>
                <div className="mt-4 overflow-hidden">
                  <div className="flex gap-2">
                    {Array.from({ length: 12 }, (_, i) => (
                      <div key={i} className="flex flex-col gap-2">
                        {Array.from({ length: 7 }, (_, j) => (
                          <SkeletonRect key={j} className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="dashboard-panel dashboard-panel-light dark:dashboard-panel-dark p-4 sm:p-5 h-full">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="space-y-2">
                    <SkeletonRect className="h-6 w-40 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                    <SkeletonRect className="h-4 w-48 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                  </div>
                </div>
                <div className="mt-4 h-56 sm:h-64">
                  <SkeletonRect className="h-full w-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                </div>
              </div>
            </div>
          </div>

          {/* Strength/Weakness & Next Steps Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <div className="dashboard-panel dashboard-panel-light dark:dashboard-panel-dark p-4 sm:p-5">
                <div className="space-y-2 mb-4">
                  <SkeletonRect className="h-6 w-48 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                  <SkeletonRect className="h-4 w-64 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                </div>
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <SkeletonRect className="h-5 w-24 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <SkeletonRect className="h-4 w-32 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                          <SkeletonRect className="h-3 w-24 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                        </div>
                        <SkeletonRect className="h-2 w-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <SkeletonRect className="h-5 w-28 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <SkeletonRect className="h-4 w-28 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                          <SkeletonRect className="h-3 w-24 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                        </div>
                        <SkeletonRect className="h-2 w-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 space-y-6">
              <div className="dashboard-panel dashboard-panel-light dark:dashboard-panel-dark p-4 sm:p-5">
                <div className="space-y-2 mb-4">
                  <SkeletonRect className="h-6 w-40 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                  <SkeletonRect className="h-4 w-52 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                </div>
                <ul className="mt-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <li key={i} className="rounded-xl border border-border-light dark:border-border-dark px-4 py-3 bg-bg-tertiary-light/40 dark:bg-bg-tertiary-dark/40">
                      <SkeletonRect className="h-4 w-36 mb-2 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                      <SkeletonRect className="h-3 w-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="dashboard-panel dashboard-panel-light dark:dashboard-panel-dark p-4 sm:p-5">
                <div className="space-y-2 mb-4">
                  <SkeletonRect className="h-6 w-32 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                  <SkeletonRect className="h-4 w-48 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                </div>
                <div className="rounded-xl border border-border-light dark:border-border-dark">
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <SkeletonRect className="h-4 w-28 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                      <SkeletonRect className="h-3 w-12 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                    </div>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between text-sm mb-2">
                        <div className="flex items-center gap-2">
                          <SkeletonRect className="h-3 w-6 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                          <SkeletonRect className="h-3 w-20 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                        </div>
                        <SkeletonRect className="h-3 w-16 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-border-light dark:border-border-dark px-4 py-3">
                  <SkeletonRect className="h-4 w-40 mb-2 bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                  <SkeletonRect className="h-3 w-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};