import React, { useState } from "react";
import { motion } from "framer-motion";
import { AiFillSun } from "react-icons/ai";
import { AiFillMoon } from "react-icons/ai";
import { useTheme } from "../context/ThemeContext";

interface FloatingThemeToggleProps {
	className?: string;
}

// ============================================================================
// THEME TOGGLE COMPONENT
// ============================================================================
export const FloatingThemeToggle: React.FC<FloatingThemeToggleProps> = ({
	className = "",
}) => {
	const { isDark, toggleTheme } = useTheme();
	// Animation variants for the button and icons
	const buttonVariants = {
		initial: { scale: 1 },
		hover: { scale: 1.1 },
		tap: { scale: 0.95 },
	};

	const iconVariants = {
		hidden: { opacity: 0, rotate: -180 },
		visible: {
			opacity: 1,
			rotate: 0,
			transition: { duration: 0.3 },
		},
		exit: {
			opacity: 0,
			rotate: 180,
			transition: { duration: 0.3 },
		},
	};

	const handleThemeToggle = () => {
		toggleTheme();
	};

	return (
		<motion.button
			onClick={handleThemeToggle}
			className={`
                fixed top-6 right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl
                flex items-center justify-center
                transition-all duration-300 ease-out
                backdrop-blur-3xl
                hover:cursor-pointer focus:outline-none
                ${
									isDark
										? "bg-bg-secondary-dark/80 hover:shadow-[0_0_20px_rgba(0,103,71,0.4)] border border-border-dark/50"
										: "bg-bg-secondary-light/80 hover:shadow-[0_0_20px_rgba(0,103,71,0.3)] border border-border-light/50"
								}
                ${className}
            `}
			aria-label="Toggle theme"
			variants={buttonVariants}
			initial="initial"
			whileHover="hover"
			whileTap="tap"
		>
			{/* Sun Icon - shown in light mode */}
			<motion.div
				className="absolute"
				variants={iconVariants}
				initial="hidden"
				animate={!isDark ? "visible" : "exit"}
				exit="hidden"
			>
				<AiFillSun
					className={`text-2xl sm:text-2xl ${
						isDark ? "text-text-primary-dark" : "text-brand-primary-light"
					}`}
				/>
			</motion.div>

			{/* Moon Icon - shown in dark mode */}
			<motion.div
				className="absolute"
				variants={iconVariants}
				initial="hidden"
				animate={isDark ? "visible" : "exit"}
				exit="hidden"
			>
				<AiFillMoon
					className={`text-2xl sm:text-2xl ${
						isDark ? "text-brand-primary-dark" : "text-text-primary-light"
					}`}
				/>
			</motion.div>
		</motion.button>
	);
};
