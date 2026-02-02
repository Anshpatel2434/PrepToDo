import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface FloatingThemeToggleProps {
    className?: string;
}

// ============================================================================
// ORBITAL THEME TOGGLE
// ============================================================================
export const FloatingThemeToggle: React.FC<FloatingThemeToggleProps> = ({
    className = "",
}) => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <motion.button
            onClick={toggleTheme}
            className={`
                fixed top-6 right-6 z-[100]
                w-12 h-12 lg:w-14 lg:h-14 rounded-full
                flex items-center justify-center
                backdrop-blur-xl border
                transition-all duration-300
                focus:outline-none
                group
                ${isDark
                    ? "bg-bg-secondary-dark/60 border-white/10 shadow-[0_0_0_0px_#10B981] hover:shadow-[0_0_0_4px_#059669]" // Emerald glow
                    : "bg-white/60 border-black/5 shadow-[0_0_0_0px_#0F5F53] hover:shadow-[0_0_0_4px_#14B8A6]" // Teal glow
                }
                ${className}
            `}
            aria-label="Toggle theme"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
        >
            <div className="relative w-6 h-6 lg:w-7 lg:h-7">
                <AnimatePresence mode="wait" initial={false}>
                    {isDark ? (
                        <motion.div
                            key="moon"
                            className="absolute inset-0 flex items-center justify-center text-blue-200"
                            initial={{ opacity: 0, rotate: -180, scale: 0.5 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            exit={{ opacity: 0, rotate: 180, scale: 0.5 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 20
                            }}
                        >
                            <Moon className="w-full h-full fill-current" strokeWidth={1.5} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sun"
                            className="absolute inset-0 flex items-center justify-center text-amber-500"
                            initial={{ opacity: 0, rotate: 180, scale: 0.5 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            exit={{ opacity: 0, rotate: -180, scale: 0.5 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 20
                            }}
                        >
                            <Sun className="w-full h-full fill-current" strokeWidth={1.5} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Ripple effect on click would be handled by a separate component or library usually, 
                 but the scale tap provides good feedback */}
        </motion.button>
    );
};
