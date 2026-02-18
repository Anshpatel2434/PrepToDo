import { useState, useEffect, useCallback } from "react";
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Evidence Stack Assets (light + dark)
import insights_light from "../../../assets/ai_insights_light.jpg";
import insights_dark from "../../../assets/ai_insights_dark.jpg";
import genre_light from "../../../assets/genre_light.png";
import genre_dark from "../../../assets/genre_dark.png";
import metrics_light from "../../../assets/metrics_light.png";
import metrics_dark from "../../../assets/metrics_dark.png";
import wps_light from "../../../assets/wps_vs_acc_light.png";
import wps_dark from "../../../assets/wps_vs_acc_dark.png";

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

/* ─────────────────────────────────────────────
   Carousel Slides Data
   ───────────────────────────────────────────── */
const evidenceSlides = [
    {
        lightSrc: genre_light,
        darkSrc: genre_dark,
        alt: "Genre Performance",
        headline: "See exactly where CAT VARC takes your marks.",
        tag: "Genre Breakdown",
    },
    {
        lightSrc: metrics_light,
        darkSrc: metrics_dark,
        alt: "Skill Proficiency",
        headline: "Your reasoning skills. No blind spots.",
        tag: "Cognitive Analysis",
    },
    {
        lightSrc: wps_light,
        darkSrc: wps_dark,
        alt: "Speed vs Accuracy",
        headline: "Speed means nothing without precision.",
        tag: "Performance Clarity",
    },
];



/* ─────────────────────────────────────────────
   3D Ring Carousel
   Shows all 3 images simultaneously:
   - Center: front-facing, largest, focused
   - Left & Right: receded, scaled down, slightly
     rotated, peeking from behind the center
   Like cards on a spinning drum.
   ───────────────────────────────────────────── */
const RingCarousel = ({ isDark }: { isDark: boolean }) => {
    const [active, setActive] = useState(0);
    const count = evidenceSlides.length;

    // Auto-rotate every 5 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setActive((prev) => (prev + 1) % count);
        }, 5000);
        return () => clearInterval(timer);
    }, [count]);

    const goTo = useCallback((index: number) => {
        setActive(index);
    }, []);

    // For each slide, compute its position relative to active
    // position: -1 = left behind, 0 = center front, 1 = right behind
    const getPosition = (index: number) => {
        let diff = index - active;
        // Wrap around for circular behavior
        if (diff > Math.floor(count / 2)) diff -= count;
        if (diff < -Math.floor(count / 2)) diff += count;
        return diff;
    };

    // Style each card based on its position on the ring
    const getCardStyle = (position: number): React.CSSProperties => {
        if (position === 0) {
            // CENTER — front, full size
            return {
                transform: "translateX(0%) scale(1) rotateY(0deg)",
                zIndex: 30,
                opacity: 1,
                filter: "brightness(1)",
            };
        } else if (position === -1) {
            // LEFT — behind & left
            return {
                transform: "translateX(-65%) scale(0.75) rotateY(25deg)",
                zIndex: 10,
                opacity: 0.6,
                filter: "brightness(0.7)",
            };
        } else if (position === 1) {
            // RIGHT — behind & right
            return {
                transform: "translateX(65%) scale(0.75) rotateY(-25deg)",
                zIndex: 10,
                opacity: 0.6,
                filter: "brightness(0.7)",
            };
        }
        // Hidden (shouldn't happen with 3 items)
        return {
            transform: "translateX(0) scale(0.5)",
            zIndex: 0,
            opacity: 0,
        };
    };

    return (
        <div className="flex flex-col items-center gap-8">
            {/* Dynamic headline + tag */}
            <div className="text-center min-h-[72px] flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col items-center gap-2.5"
                    >
                        <span className={`
                            inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                            ${isDark
                                ? "bg-brand-primary-dark/15 text-brand-primary-dark ring-1 ring-brand-primary-dark/20"
                                : "bg-brand-primary-light/10 text-brand-primary-light ring-1 ring-brand-primary-light/15"
                            }
                        `}>
                            {evidenceSlides[active].tag}
                        </span>
                        <h3 className={`text-2xl md:text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"
                            }`}>
                            {evidenceSlides[active].headline}
                        </h3>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* 3D Ring Stage — all 3 cards always visible */}
            <div
                className="relative w-full flex items-center justify-center"
                style={{ perspective: "1200px", height: "clamp(280px, 40vw, 420px)" }}
            >
                {evidenceSlides.map((slide, i) => {
                    const position = getPosition(i);
                    const style = getCardStyle(position);

                    return (
                        <div
                            key={i}
                            onClick={() => goTo(i)}
                            className="absolute cursor-pointer"
                            style={{
                                width: "clamp(260px, 50vw, 520px)",
                                transition: "all 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                                transformStyle: "preserve-3d",
                                ...style,
                            }}
                        >
                            <div className={`
                                overflow-hidden rounded-2xl
                                ${isDark
                                    ? "ring-1 ring-white/[0.1] shadow-2xl shadow-black/50"
                                    : "ring-1 ring-gray-200 shadow-2xl shadow-gray-300/30"
                                }
                            `}>
                                <img
                                    src={slide.lightSrc}
                                    alt={slide.alt}
                                    loading="lazy"
                                    className={`w-full h-auto ${isDark ? "hidden" : "block"}`}
                                />
                                <img
                                    src={slide.darkSrc}
                                    alt={slide.alt}
                                    loading="lazy"
                                    className={`w-full h-auto ${isDark ? "block" : "hidden"}`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dot indicators */}
            <div className="flex items-center gap-2">
                {evidenceSlides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => goTo(i)}
                        className={`
                            rounded-full transition-all duration-300 hover:cursor-pointer
                            ${i === active
                                ? `w-8 h-2.5 ${isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"}`
                                : `w-2.5 h-2.5 ${isDark ? "bg-white/20 hover:bg-white/40" : "bg-black/15 hover:bg-black/30"}`
                            }
                        `}
                    />
                ))}
            </div>
        </div>
    );
};


export const HeroSection: React.FC<HeroSectionProps> = ({
    isDark,
    isAuthenticated = false,
    onQuickAuth
}) => {
    const { scrollY } = useScroll();

    const smoothScrollY = useSpring(scrollY, {
        stiffness: 80,
        damping: 30,
        restDelta: 0.001
    });

    const navigate = useNavigate();
    const evidenceY = useTransform(smoothScrollY, [0, 500], [0, 30]);

    return (
        <section className={`relative min-h-[80vh] flex flex-col items-center pt-[100px] pb-20 md:pb-40 overflow-hidden ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
            }`}>

            <motion.div
                className="container mx-auto px-4 sm:px-6 md:px-8 max-w-screen-xl z-10 relative"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {/* ═══════════════════════════════════════
                    SPLIT HERO: Text (left) + AI Insights (right)
                ═══════════════════════════════════════ */}
                <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14 xl:gap-20">

                    {/* LEFT: Text + CTAs */}
                    <motion.div
                        variants={fadeInUp}
                        className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl lg:max-w-none"
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tighter leading-[0.95] mb-6 md:mb-8">
                            <span className={`block mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                                You solve CAT.
                            </span>
                            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${isDark
                                ? "from-brand-primary-dark via-brand-secondary-dark to-brand-accent-dark"
                                : "from-brand-primary-light via-brand-secondary-light to-brand-accent-light"
                                }`}>
                                PrepToDo solves
                            </span>
                            <br />
                            <span className="relative inline-block mt-1">
                                <span className={`${isDark
                                    ? "text-text-primary-dark"
                                    : "text-text-primary-light"
                                    }`}>
                                    what's holding you back.
                                </span>
                                <svg className="absolute w-full h-2 md:h-3 -bottom-1 md:-bottom-2 left-0 text-brand-primary-light opacity-80" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                    <path d="M2.00028 6.99997C2.00028 6.99997 91.0003 1.00002 198.001 2.99999" stroke={`url(#gradient-${isDark ? 'dark' : 'light'})`} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                                    <defs>
                                        <linearGradient id={`gradient-${isDark ? 'dark' : 'light'}`} x1="2" y1="6.99997" x2="198" y2="2.99999" gradientUnits="userSpaceOnUse">
                                            <stop stopColor={isDark ? "#34D399" : "#0F5F53"} />
                                            <stop offset="1" stopColor={isDark ? "#60A5FA" : "#14E38A"} />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </span>
                        </h1>

                        <p className={`text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                            }`}>
                            Built for <span className={isDark ? "text-gray-200" : "text-gray-900"}>CAT VARC</span> — Reading Comprehension and Verbal Ability — we analyze how you perform so your improvement isn't left to guesswork.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <button
                                onClick={() => !isAuthenticated ? onQuickAuth?.('signup') : navigate('/dashboard')}
                                className={`group relative h-12 px-8 rounded-xl font-semibold text-white shadow-lg shadow-brand-primary-light/20 transition-all duration-300 hover:shadow-brand-primary-light/50 hover:-translate-y-0.5 flex items-center gap-2 overflow-hidden hover:cursor-pointer ${isDark
                                    ? "bg-linear-to-r from-brand-primary-dark to-brand-secondary-dark"
                                    : "bg-linear-to-r from-brand-primary-light to-brand-secondary-light"
                                    }`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shine" />
                                <span className="relative z-10 flex items-center gap-2">
                                    {isAuthenticated ? "Continue Learning" : "Start Learning"}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>

                            <button
                                onClick={() => {
                                    const featuresSection = document.querySelector('[data-section="features"]');
                                    featuresSection?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={`group h-12 px-8 rounded-xl font-medium border backdrop-blur-sm transition-all duration-300 hover:bg-white/10 flex items-center gap-2 hover:cursor-pointer ${isDark
                                    ? "bg-white/5 border-white/10 text-white"
                                    : "bg-black/5 border-black/10 text-gray-900"
                                    }`}
                            >
                                <PlayCircle className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                                <span>See How It Works</span>
                            </button>
                        </div>
                    </motion.div>

                    {/* ═══════════════════════════════════════
                        RIGHT: Floating AI Insights
                        — 3D tilted, no boxy container
                        — Headline integrated above for impact
                    ═══════════════════════════════════════ */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="flex-1 w-full max-w-[280px] sm:max-w-sm lg:max-w-xs xl:max-w-sm flex flex-col items-center lg:items-start gap-5"
                        style={{ perspective: "1200px" }}
                    >
                        {/* Headline */}
                        <div className="flex flex-col gap-1.5 px-1">
                            <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-brand-primary-dark/70" : "text-brand-primary-light/60"}`}>
                                AI Diagnostics
                            </span>
                            <p className={`text-xl md:text-2xl font-extrabold tracking-tight leading-snug ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                                Every wrong answer
                                <br />
                                has a pattern.{" "}
                                <span
                                    className={`bg-clip-text text-transparent bg-gradient-to-r ${isDark
                                        ? "from-brand-primary-dark via-emerald-300 to-brand-primary-dark"
                                        : "from-brand-primary-light via-teal-400 to-brand-primary-light"
                                        }`}
                                    style={{
                                        backgroundSize: "200% 100%",
                                        animation: "shimmer 3s ease-in-out infinite",
                                    }}
                                >
                                    We find it.
                                </span>
                            </p>
                            <style>{`
                                @keyframes shimmer {
                                    0%, 100% { background-position: 0% 50%; }
                                    50% { background-position: 100% 50%; }
                                }
                            `}</style>
                        </div>

                        {/* Floating image */}
                        <motion.div
                            animate={{
                                y: [-4, 4, -4],
                                rotateX: [1, 3, 1],
                                rotateY: [-4, -2, -4],
                                scale: [1, 1.01, 1],
                            }}
                            transition={{
                                duration: 8,
                                ease: "easeInOut",
                                repeat: Infinity,
                            }}
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            <div className={`overflow-hidden rounded-2xl ${isDark
                                ? "shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
                                : "shadow-[0_20px_60px_-10px_rgba(15,95,83,0.3)] ring-1 ring-gray-200"
                                }`}>
                                <img
                                    src={insights_light}
                                    alt="AI Insights — personalized solution analysis"
                                    loading="eager"
                                    className={`w-full h-auto ${isDark ? "hidden" : "block"}`}
                                />
                                <img
                                    src={insights_dark}
                                    alt="AI Insights — personalized solution analysis"
                                    loading="eager"
                                    className={`w-full h-auto ${isDark ? "block" : "hidden"}`}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* ═══════════════════════════════════════════
                    3D RING CAROUSEL
                    All 3 images visible: center front,
                    sides recede behind like a spinning drum.
                    2s per image, infinite loop.
                ═══════════════════════════════════════════ */}
                <motion.div
                    style={{ y: evidenceY, willChange: "transform" }}
                    className="mt-16 md:mt-24 lg:mt-28"
                >
                    <RingCarousel isDark={isDark} />
                </motion.div>
            </motion.div>

            {/* Bottom dissolve */}
            <div className={`absolute bottom-0 left-0 right-0 h-96 pointer-events-none z-20 ${isDark ? "bg-gradient-to-t from-bg-primary-dark" : "bg-gradient-to-t from-bg-primary-light"
                } to-transparent`} />
        </section>
    );
};
