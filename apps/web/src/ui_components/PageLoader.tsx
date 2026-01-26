import React from "react";
import { useTheme } from "../context/ThemeContext";

export const PageLoader: React.FC = () => {
    const { isDark } = useTheme();

    return (
        <div className={`
            min-h-screen flex items-center justify-center
            ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}
            transition-colors duration-500
        `}>
            <div className="relative flex items-center justify-center">
                {/* Outer Ring - Geometric & Sharp */}
                <div className={`
                    absolute inset-0 w-24 h-24 border-2 
                    rotate-45
                    animate-[spin_4s_linear_infinite]
                    ${isDark ? "border-white/10" : "border-black/5"}
                `} />

                {/* Middle Ring - Reverse Spin */}
                <div className={`
                    absolute inset-0 w-16 h-16 border-2 m-auto
                    -rotate-45
                    animate-[spin_3s_linear_infinite_reverse]
                    ${isDark ? "border-brand-primary-dark/30" : "border-brand-primary-light/30"}
                `} />

                {/* Core - The Breathing Soul */}
                <div className={`
                    w-4 h-4 
                    animate-spring-in
                    rounded-sm
                    ${isDark
                        ? "bg-brand-accent-dark shadow-[0_0_20px_rgba(232,184,74,0.4)]"
                        : "bg-brand-accent-light shadow-[0_0_20px_rgba(212,160,57,0.4)]"
                    }
                    animate-pulse
                `} />

                {/* Glass backdrop effect for depth */}
                <div className={`
                    absolute -inset-12 bg-transparent backdrop-blur-[2px] rounded-full
                    scale-50 animate-[pulse_3s_ease-in-out_infinite]
                `} />
            </div>
        </div>
    );
};
