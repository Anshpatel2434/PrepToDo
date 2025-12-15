import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface HeroSectionProps {
    isDark: boolean;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.3,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
        },
    },
};

const floatingVariants = {
    initial: { y: 0, opacity: 0.6 },
    animate: {
        y: [-20, 20, -20],
        opacity: [0.4, 0.7, 0.4],
        transition: {
            duration: 4,
            repeat: Infinity,
        },
    },
};

const buttonVariants = {
    hover: {
        y: -4,
        transition: {
            duration: 0.3,
        },
    },
};

export const HeroSection: React.FC<HeroSectionProps> = ({ isDark }) => {
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 300], [0, 100]);

    return (
        <section
            className={`relative min-h-screen flex items-center justify-center overflow-hidden transition-colors duration-300 ${
                isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
            }`}
        >
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Floating orbs - theme adaptive, no vibrant colors */}
                <motion.div
                    className={`absolute top-32 right-1/4 w-4 h-4 rounded-full opacity-60 touch-none ${
                        isDark ? "bg-brand-primary-dark" : "bg-brand-secondary-light"
                    }`}
                    variants={floatingVariants}
                    initial="initial"
                    animate="animate"
                    style={{ animationDelay: "0s" }}
                />
                <motion.div
                    className={`absolute bottom-32 left-1/4 w-3 h-3 rounded-full opacity-50 touch-none ${
                        isDark ? "bg-brand-secondary-dark" : "bg-brand-primary-light"
                    }`}
                    variants={floatingVariants}
                    initial="initial"
                    animate="animate"
                    style={{ animationDelay: "1s" }}
                />
                <motion.div
                    className={`absolute top-1/2 right-16 w-2 h-2 rounded-full opacity-70 touch-none ${
                        isDark ? "bg-brand-accent-dark" : "bg-brand-accent-light"
                    }`}
                    variants={floatingVariants}
                    initial="initial"
                    animate="animate"
                    style={{ animationDelay: "2s" }}
                />

                {/* Subtle gradient overlay for depth */}
                <div
                    className={`absolute inset-0 transition-opacity duration-300 ${
                        isDark
                            ? "bg-gradient-to-b from-bg-primary-dark/0 via-bg-primary-dark/0 to-bg-secondary-dark/20"
                            : "bg-gradient-to-b from-bg-primary-light/0 via-bg-primary-light/0 to-bg-secondary-light/20"
                    }`}
                    style={{ pointerEvents: "none" }}
                />
            </div>

            {/* Main content */}
            <motion.div
                className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-24 w-full"
                style={{ y }}
            >
                <motion.div
                    className="text-center space-y-8 sm:space-y-12"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Main Heading */}
                    <motion.div className="space-y-4 sm:space-y-6" variants={itemVariants}>
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-serif font-bold leading-tight sm:leading-[0.95] lg:leading-[0.9] tracking-tight">
                            <span
                                className={`relative inline-block transition-colors duration-300 ${
                                    isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                            >
                                <img
                                    src="/favicon.svg"
                                    alt="PrepToDo Logo"
                                    className="absolute -z-10 -top-12 sm:-top-16 lg:-top-24 left-1/2 transform -translate-x-1/2 w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20"
                                />
                                <span className="relative">P</span>repToDo
                            </span>

                            <span
                                className={`block text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-sans font-medium mt-3 sm:mt-4 transition-colors duration-300 ${
                                    isDark
                                        ? "text-text-secondary-dark"
                                        : "text-text-secondary-light"
                                }`}
                            >
                                Your AI Study Companion
                            </span>
                        </h1>

                        <p
                            className={`text-base sm:text-lg lg:text-xl xl:text-2xl leading-relaxed max-w-2xl mx-auto transition-colors duration-300 ${
                                isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}
                        >
                            Transform your learning journey with intelligent study plans,
                            adaptive practice tests, and comprehensive analytics that actually
                            work.
                        </p>
                    </motion.div>

                    {/* Stats Row */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 py-6 sm:py-8 max-w-4xl mx-auto"
                        variants={itemVariants}
                    >
                        <div className="text-center space-y-2 px-2">
                            <div
                                className={`text-2xl sm:text-3xl lg:text-4xl font-bold transition-colors duration-300 ${
                                    isDark
                                        ? "text-brand-primary-dark"
                                        : "text-brand-primary-light"
                                }`}
                            >
                                AI-Powered
                            </div>
                            <div
                                className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                                    isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                }`}
                            >
                                Study Platform
                            </div>
                        </div>
                        <div className="text-center space-y-2 px-2">
                            <div
                                className={`text-2xl sm:text-3xl lg:text-4xl font-bold transition-colors duration-300 ${
                                    isDark
                                        ? "text-brand-secondary-dark"
                                        : "text-brand-secondary-light"
                                }`}
                            >
                                Smart
                            </div>
                            <div
                                className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                                    isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                }`}
                            >
                                Learning Tools
                            </div>
                        </div>
                        <div className="text-center space-y-2 px-2">
                            <div
                                className={`text-2xl sm:text-3xl lg:text-4xl font-bold transition-colors duration-300 ${
                                    isDark
                                        ? "text-brand-accent-dark"
                                        : "text-brand-accent-light"
                                }`}
                            >
                                Personalized
                            </div>
                            <div
                                className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                                    isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                }`}
                            >
                                Study Plans
                            </div>
                        </div>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2 sm:pt-4"
                        variants={itemVariants}
                    >
                        <motion.button
                            className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out focus-ring overflow-hidden ${
                                isDark
                                    ? "bg-brand-primary-dark hover:bg-brand-primary-hover-dark"
                                    : "bg-brand-primary-light hover:bg-brand-primary-hover-light"
                            }`}
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="relative z-10">Get Started</span>
                        </motion.button>

                        <motion.button
                            className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 backdrop-blur-sm font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out focus-ring border ${
                                isDark
                                    ? "bg-bg-secondary-dark/80 text-text-secondary-dark border-border-darker hover:border-brand-primary-dark"
                                    : "bg-bg-secondary-light/80 text-text-secondary-light border-border-lighter hover:border-brand-primary-light"
                            }`}
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="flex items-center justify-center gap-3">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span>Learn More</span>
                            </span>
                        </motion.button>
                    </motion.div>

                    {/* Trust indicators */}
                    <motion.div
                        className={`flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center flex-wrap pt-2 sm:pt-4 text-xs sm:text-sm transition-colors duration-300 ${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                        variants={itemVariants}
                    >
                        <div className="flex items-center gap-2">
                            <svg
                                className="w-4 h-4 text-success"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>AI-powered learning</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg
                                className="w-4 h-4 text-success"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>Personalized study plans</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg
                                className="w-4 h-4 text-success"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>Real-time analytics</span>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Scroll indicator with animation */}
            <motion.div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2">
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <svg
                        className={`w-6 h-6 transition-colors duration-300 ${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                    </svg>
                </motion.div>
            </motion.div>
        </section>
    );
};
