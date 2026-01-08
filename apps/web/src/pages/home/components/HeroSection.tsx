import React from "react";
import { motion } from "framer-motion";

interface HeroSectionProps {
    isDark: boolean;
    isAuthenticated?: boolean;
    onQuickAuth?: (action: 'signin' | 'signup') => void;
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

const buttonVariants = {
    hover: {
        y: -4,
        transition: {
            duration: 0.3,
        },
    },
};

export const HeroSection: React.FC<HeroSectionProps> = ({ 
    isDark, 
    isAuthenticated = false, 
    onQuickAuth 
}) => {
    return (
        <section
            className={`relative min-h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-300 ${
                isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
            }`}
        >
            {/* Animated background gradient mesh */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className={`absolute inset-0 opacity-30`}
                    animate={
                        {
                            background: isDark
                                ? ["linear-gradient(135deg, #1a1b3a 0%, #2d1b69 50%, #1a1b3a 100%)",
                                   "linear-gradient(135deg, #2d1b69 0%, #1a1b3a 50%, #2d1b69 100%)",
                                   "linear-gradient(135deg, #1a1b3a 0%, #2d1b69 50%, #1a1b3a 100%)"]
                                : ["linear-gradient(135deg, #f0f4ff 0%, #e6f0ff 50%, #f0f4ff 100%)",
                                   "linear-gradient(135deg, #e6f0ff 0%, #f0f4ff 50%, #e6f0ff 100%)",
                                   "linear-gradient(135deg, #f0f4ff 0%, #e6f0ff 50%, #f0f4ff 100%)"]
                        }
                    }
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                />
                
                {/* Subtle noise texture for depth */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="w-full h-full" style={{
                        backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOCIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuMDAxIi8+PC9zdmc+')",
                        backgroundSize: "100px 100px"
                    }}></div>
                </div>
            </div>

            {/* Main content */}
            <motion.div className="relative z-10 mx-auto px-4 sm:px-6 py-4 lg:py-10 w-full">
                <motion.div
                    className="text-center space-y-8 sm:space-y-12"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Main Heading with distinctive typography */}
                    <motion.div
                        className="space-y-4 sm:space-y-6"
                        variants={itemVariants}
                    >
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-serif font-bold tracking-tight">
                            <span
                                className={`relative inline-block transition-colors duration-300 ${
                                    isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                            >
                                <img
                                    src="/favicon.svg"
                                    alt="PrepToDo Logo"
                                    className="w-10 h-10 sm:w-14 sm:h-14 lg:w-30 lg:h-30 inline-block mr-2 sm:mr-4"
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

                    {/* Enhanced Stats Row with icons */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 py-6 sm:py-8 max-w-4xl mx-auto"
                        variants={itemVariants}
                    >
                        <div className="text-center space-y-2 px-2">
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center shadow-lg" style={{
                                background: isDark ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" : "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)"
                            }}>
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
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
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center shadow-lg" style={{
                                background: isDark ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #34d399 0%, #10b981 100%)"
                            }}>
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
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
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center shadow-lg" style={{
                                background: isDark ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                            }}>
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div
                                className={`text-2xl sm:text-3xl lg:text-4xl font-bold transition-colors duration-300 ${
                                    isDark ? "text-brand-accent-dark" : "text-brand-accent-light"
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

                    {/* CTA Buttons with enhanced styling */}
                    <motion.div
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2 sm:pt-4"
                        variants={itemVariants}
                    >
                        {isAuthenticated ? (
                            <motion.button
                                className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl focus-ring overflow-hidden relative group ${
                                    isDark
                                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                        : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                                }`}
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    <span>Continue Learning</span>
                                </span>
                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </motion.button>
                        ) : (
                            <motion.button
                                onClick={() => onQuickAuth?.('signup')}
                                className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl focus-ring overflow-hidden relative group ${
                                    isDark
                                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                        : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                                }`}
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                    <span>Get Started</span>
                                </span>
                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </motion.button>
                        )}

                        <motion.button
                            className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 backdrop-blur-sm font-semibold rounded-2xl shadow-lg hover:shadow-xl focus-ring border relative group ${
                                isDark
                                    ? "bg-bg-secondary-dark/80 text-text-secondary-dark border-border-darker hover:border-brand-primary-dark"
                                    : "bg-bg-secondary-light/80 text-text-secondary-light border-border-lighter hover:border-brand-primary-light"
                            }`}
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                        >
                            <span className="flex items-center justify-center gap-3 relative z-10">
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
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </motion.button>

                        {!isAuthenticated && (
                            <motion.button
                                onClick={() => onQuickAuth?.('signin')}
                                className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 backdrop-blur-sm font-semibold rounded-2xl shadow-lg hover:shadow-xl focus-ring border relative group ${
                                    isDark
                                        ? "bg-bg-secondary-dark/80 text-text-secondary-dark border-border-darker hover:border-brand-primary-dark"
                                        : "bg-bg-secondary-light/80 text-text-secondary-light border-border-lighter hover:border-brand-primary-light"
                                }`}
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="flex items-center justify-center gap-3 relative z-10">
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
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                    <span>Sign In</span>
                                </span>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </motion.button>
                        )}
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Enhanced scroll indicator */}
            <motion.div className="m-3">
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
                        isDark ? "border-brand-primary-dark text-brand-primary-dark" : "border-brand-primary-light text-brand-primary-light"
                    }`}>
                        <svg
                            className="w-4 h-4"
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
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
};