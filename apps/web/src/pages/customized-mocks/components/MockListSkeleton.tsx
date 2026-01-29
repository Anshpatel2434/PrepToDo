import React from "react";
import { useTheme } from "../../../context/ThemeContext";

const MockListSkeleton: React.FC = () => {
    const { isDark } = useTheme();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                <div
                    key={index}
                    className={`
                        p-5 rounded-3xl border animate-pulse
                        ${isDark
                            ? "bg-white/5 border-white/5"
                            : "bg-white border-gray-100"
                        }
                    `}
                >
                    {/* Header skeleton */}
                    <div className="flex items-start justify-between mb-6">
                        <div className={`h-6 rounded-lg w-16 ${isDark ? "bg-white/10" : "bg-gray-100"}`}></div>
                    </div>

                    {/* Title Area */}
                    <div className="mb-6">
                        <div className={`w-12 h-12 rounded-2xl mb-4 ${isDark ? "bg-white/10" : "bg-gray-100"}`}></div>
                        <div className={`h-6 rounded-lg w-3/4 mb-2 ${isDark ? "bg-white/10" : "bg-gray-100"}`}></div>
                        <div className={`h-4 rounded-lg w-1/3 ${isDark ? "bg-white/5" : "bg-gray-50"}`}></div>
                    </div>

                    {/* Footer skeleton */}
                    <div className={`pt-4 border-t flex items-center justify-between ${isDark ? "border-white/5" : "border-gray-100"}`}>
                        <div className={`h-4 rounded w-20 ${isDark ? "bg-white/5" : "bg-gray-50"}`}></div>
                        <div className={`h-4 rounded w-12 ${isDark ? "bg-white/5" : "bg-gray-50"}`}></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MockListSkeleton;
