import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import lightHeroImg from "../../../assets/light_hero.jpg";
import darkHeroImg from "../../../assets/dark_hero.jpg";

// New 3D Hero Assets
import leaderboard_light from "../../../assets/daily_leaderboard_light.png";
import leaderboard_dark from "../../../assets/daily_leaderboard_dark.png";
import insights_light from "../../../assets/ai_insights_light.jpg";
import insights_dark from "../../../assets/ai_insights_dark.jpg";
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
        stiffness: 80,
        damping: 30,
        restDelta: 0.001
    });

    const navigate = useNavigate();
    const animationRange = [0, 400];

    // Subtler main image effects for the single static hero
    const mainImgScale = useTransform(smoothScrollY, animationRange, [1, 0.98]);
    const mainImgOpacity = useTransform(smoothScrollY, animationRange, [1, 0.9]);

    // Adjusted Parallax: Subtle movement to avoid "floating away" on mobile
    const heroY = useTransform(smoothScrollY, [0, 500], [0, 50]);

    return (
        <section className={`relative min-h-[80vh] flex flex-col items-center pt-[100px] pb-20 md:pb-40 overflow-hidden ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
            }`}>


            <motion.div
                className="container mx-auto px-4 sm:px-6 md:px-8 max-w-screen-2xl z-10 flex flex-col items-center text-center relative gap-5"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >

                {/* Left Floating Card: AI Insights - Tilted inward from left */}
                {/* 2xl breakpoint pushes it further out to use extra space */}
                <Floating3DCard
                    lightSrc={leaderboard_light}
                    darkSrc={leaderboard_dark}
                    alt="AI Insights"
                    isDark={isDark}
                    className="top-42 -left-8 lg:-left-20 2xl:left-20 opacity-90 blur-[1px]"
                    rotateY={10}
                    rotateX={2}
                    rotateZ={-5}
                    delay={0}
                />

                {/* Right Floating Card: Leaderboard - Tilted inward from right */}
                <Floating3DCard
                    lightSrc={insights_light}
                    darkSrc={insights_dark}
                    alt="Daily Leaderboard"
                    isDark={isDark}
                    className="-top-8 -right-8 lg:-right-20 2xl:right-10 opacity-90 blur-[1px]"
                    rotateY={-10}
                    rotateX={2}
                    rotateZ={5}
                    delay={1}
                />

                {/* Hero Headline */}
                <motion.h1
                    variants={fadeInUp}
                    className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] "
                >
                    <span className="relative inline-block">
                        <span className={`bg-clip-text text-transparent bg-linear-to-r ${isDark
                            ? "from-brand-accent-dark via-brand-primary-dark to-brand-secondary-dark"
                            : "from-brand-primary-light via-brand-secondary-light to-brand-accent-light"
                            }`}>
                            An AI Tutor That Studies
                        </span>
                        {/* Underline decoration */}
                        <svg className="absolute w-full h-2 md:h-3 -bottom-1.5 md:-bottom-2 left-0 text-brand-primary-light opacity-60" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                            <path d="M2.00028 6.99997C2.00028 6.99997 91.0003 1.00002 198.001 2.99999" stroke={`url(#gradient-${isDark ? 'dark' : 'light'})`} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
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
                    className={`text-base md:text-xl max-w-2xl mb-8 leading-relaxed ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}
                >
                    Daily drills, mistake analysis, and adaptive tests built from your performance data.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    variants={fadeInUp}
                    className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12"
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

                {/* Single Simple Hero Image Container - Visible on ALL screens */}
                <motion.div
                    style={{ y: heroY, willChange: "transform" }}
                    className="relative w-full max-w-5xl lg:max-w-6xl px-4 pt-10"
                >
                    {/* Glow behind image */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-linear-to-b from-brand-primary-light/20 to-transparent blur-[60px] rounded-full pointer-events-none ${isDark ? "opacity-30" : "opacity-20"
                        }`} />

                    {/* Main Image Wrapper using MASK for perfect dissolve */}
                    <motion.div
                        style={{
                            scale: mainImgScale,
                            opacity: mainImgOpacity,
                            // This mask creates the "dissolve into next component" effect including borders
                            maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
                            WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)"
                        }}
                        className={`relative rounded-xl md:rounded-2xl shadow-2xl backdrop-blur-xl ring-1 ring-white/20 z-10 overflow-hidden`}
                    >
                        {/* Browser chrome/header */}
                        <div className={`h-6 md:h-8 w-full flex items-center px-4 gap-2 border-b relative z-20 ${isDark ? "bg-white/5 border-white/5" : "bg-white/40 border-black/5"
                            }`}>
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-400/80" />
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-amber-400/80" />
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-400/80" />
                            <div className={`ml-4 h-3 md:h-4 w-40 md:w-60 rounded-full text-[8px] md:text-[10px] flex items-center px-2 opacity-40 select-none ${isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
                                }`}>
                                preptodo.com/dashboard
                            </div>
                        </div>

                        {/* Main Dashboard Image */}
                        <SmoothThemeImage
                            lightSrc={lightHeroImg}
                            darkSrc={darkHeroImg}
                            alt="PrepToDo Dashboard Preview"
                            isDark={isDark}
                            className="w-full h-auto object-top"
                        />

                        {/* Note: Inner Gradient removed to avoid "white blur" - mask handles it now */}
                    </motion.div>
                </motion.div>

            </motion.div>

            {/* Deep Dissolve Overlay (Section Bottom edge interaction) */}
            <div className={`absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-20 ${isDark ? "bg-gradient-to-t from-bg-primary-dark" : "bg-gradient-to-t from-bg-primary-light"
                } to-transparent`} />
        </section>
    );
};
