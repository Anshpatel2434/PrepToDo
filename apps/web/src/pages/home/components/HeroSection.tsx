import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Wand2, PlayCircle, CheckCircle2 } from "lucide-react";
import logoImg from "../../../assets/logo.png";
import lightHeroImg from "../../../assets/light-hero.png";
import darkHeroImg from "../../../assets/dark-hero.png";
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

export const HeroSection: React.FC<HeroSectionProps> = ({
    isDark,
    isAuthenticated = false,
    onQuickAuth
}) => {
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);
    const navigate = useNavigate();

    return (
        <section className={`relative min-h-[110vh] flex flex-col items-center pt-10 pb-20 overflow-hidden ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
            }`}>

            <motion.div
                className="container mx-auto px-4 z-10 flex flex-col items-center text-center max-w-6xl"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >

                {/* Logo */}
                <motion.img
                    variants={fadeInUp}
                    src={logoImg}
                    alt="PrepToDo Logo"
                    className="w-20 h-20 mb-6 object-contain drop-shadow-lg"
                />

                {/* Hero Headline */}
                <motion.h1
                    variants={fadeInUp}
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
                >
                    <span className="relative inline-block mt-2">
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
                    className={`text-lg md:text-xl max-w-2xl mb-10 leading-relaxed ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
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
                        className={`group relative h-12 px-8 rounded-xl font-semibold text-white shadow-lg shadow-brand-primary-light/20 transition-all hover:scale-105 hover:shadow-brand-primary-light/40 flex items-center gap-2 overflow-hidden ${isDark
                            ? "bg-linear-to-r from-brand-primary-dark to-brand-secondary-dark"
                            : "bg-linear-to-r from-brand-primary-light to-brand-secondary-light"
                            }`}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
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
                        className={`group h-12 px-8 rounded-xl font-medium border backdrop-blur-sm transition-all hover:bg-opacity-10 dark:hover:bg-opacity-20 flex items-center gap-2 ${isDark
                            ? "bg-white/5 border-white/10 text-white hover:bg-white"
                            : "bg-black/5 border-black/10 text-gray-900 hover:bg-black"
                            }`}
                    >
                        <PlayCircle className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <span>See How It Works</span>
                    </button>
                </motion.div>

                {/* Floating Hero Visual */}
                <motion.div
                    style={{ y: heroY }}
                    className="relative w-full max-w-5xl px-4"
                >
                    {/* Glow behind image */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-linear-to-b from-brand-primary-light/20 to-transparent blur-[60px] rounded-full pointer-events-none ${isDark ? "opacity-30" : "opacity-20"
                        }`} />

                    <div className={`relative rounded-2xl overflow-hidden shadow-2xl border ${isDark ? "border-white/10 bg-gray-900/50" : "border-black/5 bg-white/50"
                        } backdrop-blur-xl ring-1 ring-white/20`}>
                        {/* Browser chrome/header only for aesthetic */}
                        <div className={`h-8 w-full flex items-center px-4 gap-2 border-b ${isDark ? "bg-white/5 border-white/5" : "bg-white/40 border-black/5"
                            }`}>
                            <div className="w-3 h-3 rounded-full bg-red-400/80" />
                            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                            <div className="w-3 h-3 rounded-full bg-green-400/80" />
                            <div className={`ml-4 h-4 w-60 rounded-full text-[10px] flex items-center px-2 opacity-40 select-none ${isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
                                }`}>
                                preptodo.com/dashboard
                            </div>
                        </div>

                        {/* Main Image */}
                        <img
                            src={isDark ? darkHeroImg : lightHeroImg}
                            alt="PrepToDo Dashboard Preview"
                            className="w-full h-auto object-cover object-top"
                        />

                        {/* Overlay Gradient for seamless bottom integration */}
                        <div className={`absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t ${isDark ? "from-bg-primary-dark" : "from-bg-primary-light"
                            } to-transparent`} />
                    </div>

                    {/* Floating Feature Cards (Parallax) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className={`absolute -left-4 md:-left-12 top-1/3 p-4 rounded-xl border backdrop-blur-md shadow-xl hidden md:block ${isDark ? "bg-gray-900/80 border-white/10" : "bg-white/80 border-black/5"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <div className={`text-xs font-medium ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>Daily Goal</div>
                                <div className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Achieved!</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className={`absolute -right-4 md:-right-12 bottom-1/4 p-4 rounded-xl border backdrop-blur-md shadow-xl hidden md:block ${isDark ? "bg-gray-900/80 border-white/10" : "bg-white/80 border-black/5"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <Wand2 className="w-5 h-5" />
                            </div>
                            <div>
                                <div className={`text-xs font-medium ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>AI Accuracy</div>
                                <div className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>98.5% Analysis</div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </section>
    );
};
