import React from "react";

const MockListSkeleton: React.FC = () => {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((index) => (
                <div
                    key={index}
                    className="p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 animate-pulse"
                >
                    {/* Header skeleton */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>

                    {/* Date skeleton */}
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>

                    {/* Metadata skeleton */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>

                    {/* Action skeleton */}
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mt-4"></div>
                </div>
            ))}
        </div>
    );
};

export default MockListSkeleton;
