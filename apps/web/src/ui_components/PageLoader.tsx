import React from "react";
import { useTheme } from "../context/ThemeContext";

interface PageLoaderProps {
    variant?: "fullscreen" | "inline" | "overlay";
    size?: "sm" | "md" | "lg" | "xl";
    message?: string;
    className?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
    variant = "fullscreen",
    size = "lg",
    message,
    className = "",
}) => {
    const { isDark } = useTheme();

    // Size mappings for the outer ring
    const sizeClasses = {
        sm: "w-6 h-6 border-[1.5px]",
        md: "w-10 h-10 border-2",
        lg: "w-16 h-16 border-2",
        xl: "w-24 h-24 border-2",
    };

    // Size mappings for the middle ring
    const middleSizeClasses = {
        sm: "w-4 h-4 border-[1.5px]",
        md: "w-6 h-6 border-2",
        lg: "w-10 h-10 border-2",
        xl: "w-16 h-16 border-2",
    };

    // Size mappings for the core
    const coreSizeClasses = {
        sm: "w-1 h-1",
        md: "w-1.5 h-1.5",
        lg: "w-2.5 h-2.5",
        xl: "w-4 h-4",
    };

    // Container classes based on variant
    const containerClasses = {
        fullscreen: `fixed inset-0 z-50 flex flex-col items-center justify-center transition-colors duration-500 ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`,
        overlay: `absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm ${isDark ? "bg-black/20" : "bg-white/20"}`,
        inline: "flex flex-col items-center justify-center",
    };

    return (
        <div className={`${containerClasses[variant]} ${className}`}>
            <div className={`relative flex items-center justify-center ${message ? "mb-4" : ""}`}>
                {/* Outer Ring - Geometric & Sharp */}
                <div className={`
                    absolute inset-0 m-auto
                    rotate-45
                    animate-[spin_4s_linear_infinite]
                    ${isDark ? "border-white/10" : "border-black/5"}
                    ${sizeClasses[size]}
                `} />

                {/* Middle Ring - Reverse Spin */}
                <div className={`
                    absolute inset-0 m-auto
                    -rotate-45
                    animate-[spin_3s_linear_infinite_reverse]
                    ${isDark ? "border-brand-primary-dark/30" : "border-brand-primary-light/30"}
                    ${middleSizeClasses[size]}
                `} />

                {/* Core - The Breathing Soul */}
                <div className={`
                    animate-spring-in
                    rounded-sm
                    ${isDark
                        ? "bg-brand-accent-dark shadow-[0_0_20px_rgba(20,227,138,0.5)]"
                        : "bg-brand-accent-light shadow-[0_0_20px_rgba(20,227,138,0.4)]"
                    }
                    animate-pulse
                    ${coreSizeClasses[size]}
                `} />

                {/* Glass backdrop effect for depth (only for larger sizes) */}
                {(size === "lg" || size === "xl") && (
                    <div className={`
                        absolute -inset-12 bg-transparent backdrop-blur-[2px] rounded-full
                        scale-50 animate-[pulse_3s_ease-in-out_infinite] pointer-events-none
                    `} />
                )}
            </div>

            {/* Optional Loading Message */}
            {message && (
                <div className={`
                    mt-4 text-center font-medium animate-pulse
                    ${size === 'sm' ? "text-xs" : "text-sm"}
                    ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                `}>
                    {message}
                </div>
            )}
        </div>
    );
};
