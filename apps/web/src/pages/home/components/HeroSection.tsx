import React from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import lightHeroImg from "../../../assets/light_hero.png";
import darkHeroImg from "../../../assets/dark_hero.png";

// Widget Imports
import widgetUL_light from "../../../assets/dashboard_upper_left_light.png";
import widgetUL_dark from "../../../assets/dashboard_upper_left_dark.png";
import widgetUR_light from "../../../assets/dashboard_upper_right_light.png";
import widgetUR_dark from "../../../assets/dashboard_upper_right_dark.png";
import widgetLL_light from "../../../assets/dashboard_lower_left_light.png";
import widgetLL_dark from "../../../assets/dashboard_lower_left_dark.png";
import widgetLR_light from "../../../assets/dashboard_lower_right_light.png";
import widgetLR_dark from "../../../assets/dashboard_lower_right_dark.png";

// New 3D Hero Assets
import leaderboard_light from "../../../assets/daily_leaderboard_light.png";
import leaderboard_dark from "../../../assets/daily_leaderboard_dark.png";
import insights_light from "../../../assets/ai_insights_light.png";
import insights_dark from "../../../assets/ai_insights_dark.png";

import { useNavigate } from "react-router-dom";

interface HeroSectionProps {
    isDark: boolean;
    isAuthenticated?: boolean;
    onQuickAuth?: (action: 'signin' | 'signup') => void;
}

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.2
        }
    }
};

// Optimized version to fix lag and blurriness using CSS variables and will-change
const SmoothThemeImage = ({
    lightSrc,
    darkSrc,
    alt,
    className,
    isDark
}: {
    lightSrc: string;
    darkSrc: string;
    alt: string;
    className?: string;
    isDark: boolean;
}) => {
    return (
        <div className={`relative ${className}`}>
            <img
                src={lightSrc}
                alt={alt}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ease-in-out ${isDark ? "opacity-0" : "opacity-100"}`}
            />
            <img
                src={darkSrc}
                alt={alt}
                className={`relative w-full h-full object-contain transition-opacity duration-500 ease-in-out ${isDark ? "opacity-100" : "opacity-0"}`}
            />
        </div>
    );
}

// 3D Floating Card Component
const Floating3DCard = ({
    lightSrc,
    darkSrc,
    alt,
    isDark,
    className,
    style,
    delay = 0,
    rotateX = 0,
    rotateY = 0,
    rotateZ = 0
}: {
    lightSrc: string;
    darkSrc: string;
    alt: string;
    isDark: boolean;
    className?: string;
    style?: React.CSSProperties;
    delay?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 + delay, ease: "easeOut" }}
            className={`absolute -z-10 hidden xl:block ${className}`}
            style={{
                perspective: "1000px",
                ...style
            }}
        >
            <motion.div
                animate={{
                    y: [-2, 2, -2],
                    rotateX: [rotateX - 0.5, rotateX + 0.5, rotateX - 0.5],
                    rotateY: [rotateY - 0.5, rotateY + 0.5, rotateY - 0.5],
                    rotateZ: [rotateZ - 0.5, rotateZ + 0.5, rotateZ - 0.5],
                }}
                transition={{
                    duration: 8,
                    ease: "easeInOut",
                    repeat: Infinity,
                    delay: delay
                }}
                style={{
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
                }}
                className="relative w-64 2xl:w-72"
            >
                <SmoothThemeImage
                    lightSrc={lightSrc}
                    darkSrc={darkSrc}
                    alt={alt}
                    isDark={isDark}
                    className="w-full h-auto drop-shadow-2xl"
                />
            </motion.div>
        </motion.div>
    );
};


export const HeroSection: React.FC<HeroSectionProps> = ({
    isDark,
    isAuthenticated = false,
    onQuickAuth
}) => {
    const { scrollY } = useScroll();

    // Add spring physics for "soothing" (smooth) feel
    // Low stiffness caused "lag", increasing to make it snappy but smooth
    const smoothScrollY = useSpring(scrollY, {
        stiffness: 150,
        damping: 30,
        restDelta: 0.001
    });

    const heroY = useTransform(smoothScrollY, [0, 500], [0, 150]);
    const navigate = useNavigate();

    const animationRange = [0, 400];

    const mainImgScale = useTransform(smoothScrollY, animationRange, [1, 0.4]);
    const mainImgOpacity = useTransform(smoothScrollY, animationRange, [1, 0.4]);
    const mainImgBlur = useTransform(smoothScrollY, animationRange, ["0px", "10px"]);

    // Precise user-defined locations preserved
    const ulX = useTransform(smoothScrollY, animationRange, [100, -15]);
    const ulY = useTransform(smoothScrollY, animationRange, [100, -30]);

    const urX = useTransform(smoothScrollY, animationRange, [-150, -70]);
    const urY = useTransform(smoothScrollY, animationRange, [100, 30]);

    const llX = useTransform(smoothScrollY, animationRange, [50, 70]);
    const llY = useTransform(smoothScrollY, animationRange, [-20, 120]);

    const lrX = useTransform(smoothScrollY, animationRange, [-50, 15]);
    const lrY = useTransform(smoothScrollY, animationRange, [-20, 20]);

    // Common widget transforms
    const widgetScale = useTransform(smoothScrollY, animationRange, [0.4, 1]);
    const widgetOpacity = useTransform(smoothScrollY, animationRange, [0, 1]);
    const widgetBlur = useTransform(smoothScrollY, animationRange, ["10px", "0px"]);


    return (
        <section className={`relative min-h-[90vh] md:min-h-screen flex flex-col items-center pt-[100px] pb-32 md:pb-52 overflow-hidden ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
            }`}>

            <motion.div
                className="container mx-auto pl-18 sm:pl-20 md:pl-24 pr-4 lg:pr-8 max-w-screen-2xl z-10 flex flex-col items-center text-center relative"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >

                {/* Left Floating Card: AI Insights - Tilted inward from left */}
                {/* 2xl breakpoint pushes it further out to use extra space */}
                <Floating3DCard
                    lightSrc={insights_light}
                    darkSrc={insights_dark}
                    alt="AI Insights"
                    isDark={isDark}
                    className="top-42 -left-8 lg:-left-20 2xl:left-20 opacity-90"
                    rotateY={10}
                    rotateX={2}
                    rotateZ={-5}
                    delay={0}
                />

                {/* Right Floating Card: Leaderboard - Tilted inward from right */}
                <Floating3DCard
                    lightSrc={leaderboard_light}
                    darkSrc={leaderboard_dark}
                    alt="Daily Leaderboard"
                    isDark={isDark}
                    className="-top-8 -right-8 lg:-right-20 2xl:right-10 opacity-90"
                    rotateY={-10}
                    rotateX={2}
                    rotateZ={5}
                    delay={1}
                />

                {/* Hero Headline */}
                <motion.h1
                    variants={fadeInUp}
                    className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
                >
                    <span className="relative inline-block">
                        <span className={`bg-clip-text text-transparent bg-linear-to-r ${isDark
                            ? "from-brand-accent-dark via-brand-primary-dark to-brand-secondary-dark"
                            : "from-brand-primary-light via-brand-secondary-light to-brand-accent-light"
                            }`}>
                            An AI Tutor That Studies
                        </span>
                        {/* Underline decoration */}
                        <svg className="absolute w-full h-3 -bottom-2 left-0 text-brand-primary-light opacity-60" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.00028 6.99997C2.00028 6.99997 91.0003 1.00002 198.001 2.99999" stroke={`url(#gradient-${isDark ? 'dark' : 'light'})`} strokeWidth="3" strokeLinecap="round" />
                            <defs>
                                <linearGradient id={`gradient-${isDark ? 'dark' : 'light'}`} x1="2" y1="6.99997" x2="198" y2="2.99999" gradientUnits="userSpaceOnUse">
                                    <stop stopColor={isDark ? "#34D399" : "#0F5F53"} />
                                    <stop offset="1" stopColor={isDark ? "#60A5FA" : "#14E38A"} />
                                </linearGradient>
                            </defs>
                        </svg>
                    </span>

                    <br />
                    <span className={isDark ? "text-text-primary-dark" : "text-text-primary-light"}>
                        You as Closely as You Study CAT
                    </span>
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    variants={fadeInUp}
                    className={`text-base md:text-xl max-w-2xl mb-10 leading-relaxed ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}
                >
                    Daily drills, mistake analysis, and adaptive tests built from your performance data.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    variants={fadeInUp}
                    className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-20"
                >
                    <button
                        onClick={() => !isAuthenticated ? onQuickAuth?.('signup') : navigate('/dashboard')}
                        className={`group relative h-12 px-8 rounded-xl font-semibold text-white shadow-lg shadow-brand-primary-light/20 transition-all duration-300 hover:shadow-brand-primary-light/50 hover:-translate-y-0.5 flex items-center gap-2 overflow-hidden ${isDark
                            ? "bg-linear-to-r from-brand-primary-dark to-brand-secondary-dark"
                            : "bg-linear-to-r from-brand-primary-light to-brand-secondary-light"
                            }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shine" />
                        <span className="relative z-10 flex items-center gap-2">
                            {isAuthenticated ? "Continue Learning" : "Start Learning Free"}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            const featuresSection = document.querySelector('[data-section="features"]');
                            featuresSection?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`group h-12 px-8 rounded-xl font-medium border backdrop-blur-sm transition-all duration-300 hover:bg-white/10 flex items-center gap-2 ${isDark
                            ? "bg-white/5 border-white/10 text-white"
                            : "bg-black/5 border-black/10 text-gray-900"
                            }`}
                    >
                        <PlayCircle className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <span>Explore Features</span>
                    </button>
                </motion.div>

                {/* Floating Hero Visual Container */}
                <motion.div
                    style={{ y: heroY }}
                    className="relative w-full max-w-4xl lg:max-w-5xl 2xl:max-w-6xl px-4 pt-3 mb-20 md:mb-0"
                >
                    {/* <style>{`
                        @keyframes float-ul { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
                        @keyframes float-ur { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
                        @keyframes float-ll { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
                        @keyframes float-lr { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
                    `}</style> */}

                    {/* Glow behind image */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-linear-to-b from-brand-primary-light/20 to-transparent blur-[60px] rounded-full pointer-events-none ${isDark ? "opacity-30" : "opacity-20"
                        }`} />

                    {/* Main Image Wrapper */}
                    <motion.div
                        style={{ scale: mainImgScale, opacity: mainImgOpacity, filter: mainImgBlur }}
                        className={`relative rounded-2xl overflow-hidden shadow-2xl border ${isDark ? "border-white/10 bg-gray-900/50" : "border-black/5 bg-white/50"
                            } backdrop-blur-xl ring-1 ring-white/20 z-10`}
                    >
                        {/* Browser chrome/header */}
                        <div className={`h-8 w-full flex items-center px-4 gap-2 border-b relative z-20 ${isDark ? "bg-white/5 border-white/5" : "bg-white/40 border-black/5"
                            }`}>
                            <div className="w-3 h-3 rounded-full bg-red-400/80" />
                            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                            <div className="w-3 h-3 rounded-full bg-green-400/80" />
                            <div className={`ml-4 h-4 w-60 rounded-full text-[10px] flex items-center px-2 opacity-40 select-none ${isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
                                }`}>
                                preptodo.com/dashboard
                            </div>
                        </div>

                        {/* Main Dashboard Image with Smooth Theme Transition */}
                        <SmoothThemeImage
                            lightSrc={lightHeroImg}
                            darkSrc={darkHeroImg}
                            alt="PrepToDo Dashboard Preview"
                            isDark={isDark}
                            className="w-full h-auto object-top"
                        />

                        {/* Overlay Gradient */}
                        <div className={`absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t pointer-events-none z-20 ${isDark ? "from-bg-primary-dark" : "from-bg-primary-light"
                            } to-transparent`} />
                    </motion.div>

                    {/* ---- EXPLODED WIDGETS ---- */}

                    {/* Upper Left Widget */}
                    <motion.div
                        style={{ x: ulX, y: ulY, scale: widgetScale, opacity: widgetOpacity, filter: WidgetBlurFilter(widgetBlur), backfaceVisibility: "hidden" }}
                        className="absolute top-10 sm:top-0 left-0 md:left-0 w-[42%] md:w-[44%] z-20 origin-center"
                    >
                        <div
                            style={{ animation: "float-ul 4s ease-in-out infinite" }}
                            className="w-full drop-shadow-2xl rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden"
                        >
                            <SmoothThemeImage
                                lightSrc={widgetUL_light}
                                darkSrc={widgetUL_dark}
                                alt="User Stats Widget"
                                isDark={isDark}
                                className="w-full h-auto"
                            />
                        </div>
                    </motion.div>

                    {/* Upper Right Widget */}
                    <motion.div
                        style={{ x: urX, y: urY, scale: widgetScale, opacity: widgetOpacity, filter: WidgetBlurFilter(widgetBlur), backfaceVisibility: "hidden" }}
                        className="absolute top-[30px] sm:top-[20px] right-0 md:right-0 w-[42%] md:w-[44%] z-20 origin-center"
                    >
                        <div
                            style={{ animation: "float-ur 5s ease-in-out infinite", animationDelay: "1s" }}
                            className="w-full drop-shadow-2xl rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden"
                        >
                            <SmoothThemeImage
                                lightSrc={widgetUR_light}
                                darkSrc={widgetUR_dark}
                                alt="Proficiency Widget"
                                isDark={isDark}
                                className="w-full h-auto"
                            />
                        </div>
                    </motion.div>

                    {/* Lower Left Widget */}
                    <motion.div
                        style={{ x: llX, y: llY, scale: widgetScale, opacity: widgetOpacity, filter: WidgetBlurFilter(widgetBlur), backfaceVisibility: "hidden" }}
                        className="absolute bottom-[60px] sm:bottom-[40px] left-0 md:left-0 w-[39%] md:w-[40%] z-20 origin-center"
                    >
                        <div
                            style={{ animation: "float-ll 4.5s ease-in-out infinite", animationDelay: "0.5s" }}
                            className="w-full drop-shadow-2xl rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden"
                        >
                            <SmoothThemeImage
                                lightSrc={widgetLL_light}
                                darkSrc={widgetLL_dark}
                                alt="Heatmap Widget"
                                isDark={isDark}
                                className="w-full h-auto"
                            />
                        </div>
                    </motion.div>

                    {/* Lower Right Widget */}
                    <motion.div
                        style={{ x: lrX, y: lrY, scale: widgetScale, opacity: widgetOpacity, filter: WidgetBlurFilter(widgetBlur), backfaceVisibility: "hidden" }}
                        className="absolute bottom-4 sm:bottom-0 right-0 md:right-0 w-[46%] md:w-[48%] z-20 origin-center"
                    >
                        <div
                            style={{ animation: "float-lr 5.5s ease-in-out infinite", animationDelay: "1.5s" }}
                            className="w-full drop-shadow-2xl rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden"
                        >
                            <SmoothThemeImage
                                lightSrc={widgetLR_light}
                                darkSrc={widgetLR_dark}
                                alt="Speed Accuracy Widget"
                                isDark={isDark}
                                className="w-full h-auto"
                            />
                        </div>
                    </motion.div>

                </motion.div>
            </motion.div>
        </section>
    );
};

// Helper for filter transform
const WidgetBlurFilter = (val: any) => useTransform(val, (v) => `blur(${v})`);
