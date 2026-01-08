import React from "react";
import { FaGraduationCap, FaBrain, FaChartLine } from "react-icons/fa";
import { motion } from "framer-motion";

interface IntroductionSectionProps {
    isDark: boolean;
}

export const IntroductionSection: React.FC<IntroductionSectionProps> = ({
    isDark,
}) => {
    const paragraphs = [
        {
            title: "Revolutionizing Education Through AI",
            content:
                "PrepToDo is a cutting-edge educational platform that harnesses the power of artificial intelligence to create personalized learning experiences. Our platform excels in analyzing study patterns and helping students grow holistically.",
            icon: FaGraduationCap,
        },
        {
            title: "Adaptive Learning Intelligence",
            content:
                "Our sophisticated algorithms understand your unique learning style, track your progress in real-time, and adapt your study journey to maximize retention and performance. Every interaction builds upon your existing knowledge while strengthening weak areas.",
            icon: FaBrain,
        },
        {
            title: "Transformative Study Experience",
            content:
                "Experience a study platform that's not just personalized, but truly transformative—helping you achieve better grades, deeper understanding, and lasting knowledge retention through intelligent analytics and guidance.",
            icon: FaChartLine,
        },
    ];

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

    return (
        <section
            className={`relative py-16 sm:py-20 md:py-24 lg:py-28 overflow-hidden transition-colors duration-300 ${
                isDark ? "bg-bg-primary-dark" : "bg-bg-secondary-light"
            }`}
        >
            {/* Enhanced Background Elements with geometric patterns */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradient mesh background */}
                <motion.div
                    className={`absolute inset-0 opacity-20`}
                    animate={
                        {
                            background: isDark
                                ? ["linear-gradient(45deg, #1a1b3a 0%, #2d1b69 100%)",
                                   "linear-gradient(45deg, #2d1b69 0%, #1a1b3a 100%)",
                                   "linear-gradient(45deg, #1a1b3a 0%, #2d1b69 100%)"]
                                : ["linear-gradient(45deg, #f0f4ff 0%, #e6f0ff 100%)",
                                   "linear-gradient(45deg, #e6f0ff 0%, #f0f4ff 100%)",
                                   "linear-gradient(45deg, #f0f4ff 0%, #e6f0ff 100%)"]
                        }
                    }
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                />
                
                {/* Geometric pattern overlay */}
                <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full" style={{
                        backgroundImage: "linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%)",
                        backgroundSize: "20px 20px",
                        backgroundPosition: "0 0, 10px 10px"
                    }}></div>
                </div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header with enhanced styling */}
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
                            About PrepToDo
                        </span>
                    </motion.div>

                    <h2
                        className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 sm:mb-6 transition-colors duration-300 ${
                            isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}
                    >
                        Why Students Choose
                        <br />
                        <span
                            className={`transition-colors duration-300 ${
                                isDark ? "text-brand-primary-dark" : "text-brand-primary-light"
                            }`}
                        >
                            PrepToDo
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
                </motion.div>

                {/* Content Cards with enhanced design */}
                <motion.div
                    className="space-y-6 sm:space-y-8 lg:space-y-10"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={containerVariants}
                >
                    {paragraphs.map((paragraph, index) => {
                        const Icon = paragraph.icon;
                        const gradientColors = [
                            ["#4f46e5", "#7c3aed"],
                            ["#10b981", "#059669"],
                            ["#f59e0b", "#d97706"]
                        ];
                        const currentGradient = gradientColors[index % gradientColors.length];
                        
                        return (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.3 }}
                            >
                                <motion.div
                                    className={`max-w-4xl mx-auto p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl sm:rounded-3xl backdrop-blur-sm shadow-lg border ${
                                        isDark
                                            ? "bg-bg-secondary-dark/60 border-border-dark"
                                            : "bg-bg-primary-light/60 border-border-light"
                                    }`}
                                    whileHover={{
                                        boxShadow: isDark
                                            ? "0 20px 40px rgba(0, 0, 0, 0.5)"
                                            : "0 20px 40px rgba(0, 0, 0, 0.15)",
                                    }}
                                >
                                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
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
                                            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                            <motion.div
                                                className={`absolute inset-0 rounded-xl sm:rounded-2xl blur-lg opacity-0`}
                                                style={{
                                                    background: `linear-gradient(135deg, ${currentGradient[0]} 0%, ${currentGradient[1]} 100%)`
                                                }}
                                                whileHover={{ opacity: 0.4 }}
                                            />
                                        </motion.div>

                                        {/* Text Content with enhanced typography */}
                                        <div className="flex-1 space-y-3 sm:space-y-4">
                                            <h3
                                                className={`text-xl sm:text-2xl md:text-3xl font-bold transition-colors duration-300 ${
                                                    isDark
                                                        ? "text-text-primary-dark"
                                                        : "text-text-primary-light"
                                                }`}
                                            >
                                                {paragraph.title}
                                            </h3>

                                            <p
                                                className={`text-base sm:text-lg md:text-xl leading-relaxed transition-colors duration-300 ${
                                                    isDark
                                                        ? "text-text-secondary-dark"
                                                        : "text-text-secondary-light"
                                                }`}
                                            >
                                                {paragraph.content}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Enhanced Bottom Badge */}
                <motion.div
                    className="text-center mt-12 sm:mt-14 md:mt-16 lg:mt-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                >
                    <div
                        className={`inline-flex items-center gap-2 sm:gap-3 transition-colors duration-300 ${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                    >
                        <motion.div
                            className={`w-2 h-2 rounded-full ${
                                isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"
                            }`}
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-xs sm:text-sm font-medium">
                            Experience the future of learning
                        </span>
                        <motion.div
                            className={`w-2 h-2 rounded-full ${
                                isDark ? "bg-brand-secondary-dark" : "bg-brand-secondary-light"
                            }`}
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        />
                    </div>
                </motion.div>
            </div>
        </section>
    );
};