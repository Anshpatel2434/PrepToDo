import React from "react";
import {
    MdMenuBook,
    MdQuiz,
    MdSpellcheck,
    MdInsertChart,
    MdPeople,
    MdAutoAwesome,
} from "react-icons/md";
import { motion } from "framer-motion";

interface FeatureShowcaseProps {
    isDark: boolean;
}

const features = [
    {
        id: "reading-practice",
        title: "Daily Reading Comprehension",
        description:
            "Timed RC practice sessions with microlearning passages, difficulty selection, and built-in analytics.",
        icon: MdMenuBook,
        benefits: [
            "Adaptive difficulty levels",
            "Real exam simulation",
            "Progress tracking",
            "Streak-based motivation",
        ],
        path: "/reading-practice",
    },
    {
        id: "varc-drills",
        title: "VARC Question Engine",
        description:
            "Interactive drills for para jumbles, summaries, critical reasoning, and vocabulary with AI assistance.",
        icon: MdQuiz,
        benefits: [
            "Multiple question types",
            "Auto-checked answers",
            "Detailed explanations",
            "AI-powered hints",
        ],
        path: "/varc-drills",
    },
    {
        id: "vocabulary-builder",
        title: "Smart Vocabulary Builder",
        description:
            "Personal dictionary with spaced repetition, mnemonics, and words saved directly from your reading.",
        icon: MdSpellcheck,
        benefits: [
            "Spaced repetition system",
            "Personal mnemonics",
            "Context-based learning",
            "Mastery tracking",
        ],
        path: "/vocabulary-builder",
    },
    {
        id: "analytics-dashboard",
        title: "Performance Analytics",
        description:
            "Comprehensive dashboard with visualizations, peer comparisons, and real-time progress updates.",
        icon: MdInsertChart,
        benefits: [
            "Visual progress tracking",
            "Peer comparisons",
            "Topic-wise mastery",
            "Real-time insights",
        ],
        path: "/analytics",
    },
    {
        id: "social-learning",
        title: "Social Learning Hub",
        description:
            "Leaderboards, study groups, and peer challenges to keep you motivated and engaged.",
        icon: MdPeople,
        benefits: [
            "Daily leaderboards",
            "Study groups",
            "Peer challenges",
            "Achievement system",
        ],
        path: "/social-learning",
    },
    {
        id: "ai-tutor",
        title: "AI Study Tutor",
        description:
            "24/7 AI assistance with content generation, instant feedback, and personalized study recommendations.",
        icon: MdAutoAwesome,
        benefits: [
            "24/7 availability",
            "Personalized guidance",
            "Instant feedback",
            "Smart recommendations",
        ],
        path: "/ai-tutor",
    },
];

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ isDark }) => {
    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
            },
        },
    };

    const headerVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
            },
        },
    };

    // Gradient colors for feature icons
    const gradientColors = [
        ["#4f46e5", "#7c3aed"],
        ["#10b981", "#059669"],
        ["#f59e0b", "#d97706"],
        ["#8b5cf6", "#a855f7"],
        ["#3b82f6", "#1d4ed8"],
        ["#ec4899", "#be185d"]
    ];

    return (
        <section
            className={`relative py-16 sm:py-20 md:py-24 lg:py-28 overflow-hidden transition-colors duration-300 ${
                isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
            }`}
        >
            {/* Enhanced Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Animated gradient background */}
                <motion.div
                    className={`absolute inset-0 opacity-15`}
                    animate={
                        {
                            background: isDark
                                ? ["linear-gradient(135deg, #1a1b3a 0%, #2d1b69 100%)",
                                   "linear-gradient(135deg, #2d1b69 0%, #1a1b3a 100%)",
                                   "linear-gradient(135deg, #1a1b3a 0%, #2d1b69 100%)"]
                                : ["linear-gradient(135deg, #f0f4ff 0%, #e6f0ff 100%)",
                                   "linear-gradient(135deg, #e6f0ff 0%, #f0f4ff 100%)",
                                   "linear-gradient(135deg, #f0f4ff 0%, #e6f0ff 100%)"]
                        }
                    }
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                />
                
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full" style={{
                        backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                        backgroundSize: "20px 20px"
                    }}></div>
                </div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Enhanced Section Header */}
                <motion.div
                    className="text-center mb-12 sm:mb-14 md:mb-16 lg:mb-20"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={headerVariants}
                >
                    <motion.div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-sm mb-4 sm:mb-6 border ${
                            isDark
                                ? "bg-brand-primary-dark/20 border-brand-primary-dark/30"
                                : "bg-brand-primary-light/10 border-brand-primary-light/20"
                        }`}
                        whileHover={{ scale: 1.05 }}
                    >
                        <motion.div
                            className={`w-2 h-2 rounded-full ${
                                isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"
                            }`}
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span
                            className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                                isDark ? "text-brand-primary-dark" : "text-brand-primary-light"
                            }`}
                        >
                            Powerful Features
                        </span>
                    </motion.div>

                    <h2
                        className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 sm:mb-6 transition-colors duration-300 ${
                            isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}
                    >
                        Transform Your
                        <br />
                        <span
                            className={`transition-colors duration-300 ${
                                isDark ? "text-brand-primary-dark" : "text-brand-primary-light"
                            }`}
                        >
                            Study Experience
                        </span>
                    </h2>

                    <motion.div
                        className={`w-16 sm:w-20 md:w-24 h-1 mx-auto rounded-full ${
                            isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"
                        }`}
                        initial={{ width: 0 }}
                        whileInView={{ width: "auto" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    />

                    <p
                        className={`text-base sm:text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mt-4 sm:mt-6 transition-colors duration-300 ${
                            isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}
                    >
                        Discover how PrepToDo's comprehensive suite of AI-powered tools can
                        revolutionize your learning journey and accelerate your academic
                        growth.
                    </p>
                </motion.div>

                {/* Enhanced Features Grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 xl:gap-12"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    variants={containerVariants}
                >
                    {features.map((feature, index) => {
                        const IconComponent = feature.icon;
                        const currentGradient = gradientColors[index % gradientColors.length];
                        
                        return (
                            <motion.div
                                key={feature.id}
                                variants={itemVariants}
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.3 }}
                                className="group"
                            >
                                <motion.div
                                    className={`
                                        relative p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl backdrop-blur-sm shadow-lg border
                                        ${
                                            isDark
                                                ? "bg-bg-secondary-dark border-border-dark hover:border-brand-primary-dark"
                                                : "bg-bg-secondary-light border-border-light hover:border-brand-primary-light"
                                        }
                                        hover:shadow-xl
                                    `}
                                    whileHover={{
                                        boxShadow: isDark
                                            ? "0 20px 40px rgba(0, 0, 0, 0.5)"
                                            : "0 20px 40px rgba(0, 0, 0, 0.15)",
                                    }}
                                >
                                    {/* Feature Header */}
                                    <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-4 sm:mb-6">
                                        {/* Enhanced Icon with gradient */}
                                        <motion.div
                                            className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg`}
                                            style={{
                                                background: `linear-gradient(135deg, ${currentGradient[0]} 0%, ${currentGradient[1]} 100%)`
                                            }}
                                            whileHover={{
                                                scale: 1.1,
                                                rotate: [0, -10, 10, 0],
                                            }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                            <motion.div
                                                className={`absolute inset-0 rounded-xl sm:rounded-2xl blur-lg opacity-0`}
                                                style={{
                                                    background: `linear-gradient(135deg, ${currentGradient[0]} 0%, ${currentGradient[1]} 100%)`
                                                }}
                                                whileHover={{ opacity: 0.4 }}
                                            />
                                        </motion.div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-2">
                                            <h3
                                                className={`text-xl sm:text-2xl md:text-3xl font-bold transition-colors duration-300 ${
                                                    isDark
                                                        ? "text-text-primary-dark"
                                                        : "text-text-primary-light"
                                                }`}
                                            >
                                                {feature.title}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p
                                        className={`text-base sm:text-lg leading-relaxed mb-4 sm:mb-6 relative z-10 transition-colors duration-300 ${
                                            isDark
                                                ? "text-text-secondary-dark"
                                                : "text-text-secondary-light"
                                        }`}
                                    >
                                        {feature.description}
                                    </p>

                                    {/* Enhanced Demo Image */}
                                    <div className="mb-4 sm:mb-6 relative z-10">
                                        <div
                                            className={`w-full h-32 sm:h-40 md:h-48 rounded-xl sm:rounded-2xl overflow-hidden shadow-md border transition-colors duration-300 ${
                                                isDark
                                                    ? "border-border-dark bg-bg-tertiary-dark"
                                                    : "border-border-light bg-bg-tertiary-light"
                                            }`}
                                        >
                                            <div className="w-full h-full flex items-center justify-center">
                                                {/* Enhanced Demo image placeholder */}
                                                <div className="text-center">
                                                    <div
                                                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-2 sm:mb-4 mx-auto`}
                                                        style={{
                                                            background: `linear-gradient(135deg, ${currentGradient[0]} 0%, ${currentGradient[1]} 100%)`,
                                                            opacity: 0.8
                                                        }}
                                                    >
                                                        <IconComponent className="text-xl sm:text-2xl text-white" />
                                                    </div>
                                                    <p
                                                        className={`text-xs sm:text-sm font-medium ${
                                                            isDark
                                                                ? "text-text-muted-dark"
                                                                : "text-text-muted-light"
                                                        }`}
                                                    >
                                                        {feature.title} Preview
                                                    </p>
                                                    <p
                                                        className={`text-xs mt-1 ${
                                                            isDark
                                                                ? "text-text-muted-dark"
                                                                : "text-text-muted-light"
                                                        }`}
                                                    >
                                                        Interactive demo coming soon
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Benefits List with enhanced styling */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                                        {feature.benefits.map((benefit, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 group/item"
                                            >
                                                <motion.div
                                                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-sm`}
                                                    style={{
                                                        background: `linear-gradient(135deg, ${currentGradient[0]} 0%, ${currentGradient[1]} 100%)`
                                                    }}
                                                    whileHover={{ scale: 1.1 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <svg
                                                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </motion.div>
                                                <span
                                                    className={`text-xs sm:text-sm font-medium transition-colors duration-200 ${
                                                        isDark
                                                            ? "text-text-secondary-dark"
                                                            : "text-text-secondary-light"
                                                    }`}
                                                >
                                                    {benefit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Enhanced Hover action indicator */}
                                    <motion.div
                                        className={`
                                            absolute top-4 sm:top-6 right-4 sm:right-6 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2
                                            flex items-center justify-center opacity-0 group-hover:opacity-100
                                            transform scale-75 group-hover:scale-100
                                            ${
                                                isDark
                                                    ? "border-brand-primary-dark text-brand-primary-dark"
                                                    : "border-brand-primary-light text-brand-primary-light"
                                            }
                                        `}
                                        whileHover={{ scale: 1.1 }}
                                    >
                                        <svg
                                            className="w-3 h-3 sm:w-4 sm:h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Enhanced Bottom CTA */}
                <motion.div
                    className="text-center mt-12 sm:mt-14 md:mt-16 lg:mt-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <div className="inline-flex flex-col sm:flex-row gap-4">
                        <motion.button
                            className={`
                                px-6 sm:px-8 py-3 sm:py-4 text-white font-semibold rounded-xl sm:rounded-2xl
                                shadow-lg hover:shadow-xl focus-ring
                                ${
                                    isDark
                                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                        : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                                }
                            `}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="text-sm sm:text-base">Explore All Features</span>
                        </motion.button>
                        <motion.button
                            className={`
                                px-6 sm:px-8 py-3 sm:py-4 backdrop-blur-sm font-semibold rounded-xl sm:rounded-2xl
                                shadow-lg hover:shadow-xl focus-ring border
                                ${
                                    isDark
                                        ? "bg-bg-tertiary-dark/80 text-text-secondary-dark border-border-darker hover:border-brand-primary-dark"
                                        : "bg-bg-tertiary-light/80 text-text-secondary-light border-border-lighter hover:border-brand-primary-light"
                                }
                            `}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="text-sm sm:text-base">Start Free Trial</span>
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};