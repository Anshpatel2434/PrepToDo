import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, ShieldAlert, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { FloatingNavigation } from '../../ui_components/FloatingNavigation';
import { FloatingThemeToggle } from '../../ui_components/ThemeToggle';
import { Footer } from '../home/components/Footer';
import { useSeoMetadata } from './seo_helpers';

export const DailyPracticePage: React.FC = () => {
    const { isDark } = useTheme();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const title = "Daily CAT VARC Practice Online — RC & VA Drills | PrepToDo";
    const description = "Engage in daily CAT VARC practice online. Solve curated Reading Comprehension passages and Verbal Ability questions. Track streaks & rank on leaderboard.";

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "PrepToDo Daily VARC Practice",
        "description": "An interactive web application offering daily practice questions, RCs, and Verbal Ability tests for CAT exam candidates.",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires HTML5 compatible browser",
        "offers": {
            "@type": "Offer",
            "price": "0.00",
            "priceCurrency": "INR"
        }
    };

    useSeoMetadata({ title, description, canonicalPath: "/daily-practice", schemaData });

    const faqs = [
        {
            q: "Is the Daily Practice section on PrepToDo free?",
            a: "Yes. PrepToDo offers a free tier that allows all registered users to solve the active daily RC passage and daily VA questions. Historical practice archives can be unlocked via the premium plan."
        },
        {
            q: "What time do new daily practice drills release?",
            a: "New daily drills go live every single day at 6:00 AM IST. You have 24 hours to complete them to maintain your daily streak count and earn points multiplier bonuses."
        },
        {
            q: "What happens if I miss a daily practice test?",
            a: "If you miss a daily test, your active practice streak will reset. However, you can use streak freeze tokens (earned by maintaining long streaks) to preserve your streak, or access the test from the database archives."
        },
        {
            q: "How does PrepToDo's daily practice differ from solving books?",
            a: "PrepToDo is the only daily VARC practice online that tracks your cognitive reading metrics (time spent per sentence, hesitation index, trap vulnerability). Books cannot measure your speed, and standard test portals do not give cognitive feedback."
        }
    ];

    return (
        <div className={`min-h-screen relative ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"} transition-colors duration-300`}>
            <div className={`absolute inset-0 pointer-events-none ${isDark
                ? "bg-linear-to-br from-brand-primary-dark/3 via-transparent to-brand-accent-dark/3"
                : "bg-linear-to-br from-brand-primary-light/3 via-transparent to-brand-accent-light/3"
                }`} />

            <FloatingThemeToggle />
            <FloatingNavigation />

            <div className="min-h-screen overflow-x-hidden px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-10 relative z-10 flex flex-col">
                <div className="max-w-4xl mx-auto w-full pb-16 grow">
                    
                    {/* Hero */}
                    <div className="text-center mb-12">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3
                            ${isDark ? "bg-brand-primary-dark/15 text-brand-primary-hover-dark" : "bg-brand-primary-light/10 text-brand-primary-light"}`}>
                            <Calendar size={12} /> Daily Learning Routine
                        </span>
                        <h1 className={`font-serif font-bold text-3xl sm:text-5xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            Daily CAT VARC Practice Online
                        </h1>
                        <p className={`text-sm sm:text-base max-w-2xl mx-auto ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            Build a consistent habit of active reading and logical puzzle solving. Solve 1 RC and 3 VA questions every morning, track your streak, and measure your speed.
                        </p>
                    </div>

                    {/* CTA Section */}
                    <div className={`mb-12 rounded-2xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-6
                        ${isDark ? 'border-brand-primary-dark/20 bg-bg-secondary-dark' : 'border-brand-primary-light/20 bg-white'}`}
                    >
                        <div>
                            <h3 className={`font-bold text-base sm:text-lg mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Start Today's Daily Practice Drill
                            </h3>
                            <p className={`text-xs sm:text-sm ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                6:00 AM IST release is now active. Solve today's test and maintain your streak.
                            </p>
                        </div>
                        <a href="/auth" className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0
                            ${isDark 
                                ? 'bg-brand-primary-dark text-bg-primary-dark hover:bg-brand-primary-hover-dark' 
                                : 'bg-brand-primary-light text-white hover:bg-brand-primary-hover-light'}`}>
                            Solve Today's Test <ArrowRight size={14} />
                        </a>
                    </div>

                    {/* Daily Process Steps */}
                    <div className="space-y-6 mb-12">
                        <div className="flex gap-4">
                            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs
                                ${isDark ? 'bg-brand-primary-dark text-bg-primary-dark' : 'bg-brand-primary-light text-white'}`}>
                                1
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm sm:text-base mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                    Daily Reading Comprehension (Daily RC)
                                </h3>
                                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                                    Every morning at 6:00 AM, we deliver one high-quality academic passage covering topics like philosophical aesthetics, sociology, or evolutionary biology. Solve the 4 accompanying questions in under 10 minutes.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs
                                ${isDark ? 'bg-brand-primary-dark text-bg-primary-dark' : 'bg-brand-primary-light text-white'}`}>
                                2
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm sm:text-base mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                    Daily Verbal Ability (Daily VA)
                                </h3>
                                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                                    Alongside the RC, we provide 3 Verbal Ability questions, cycling daily through Para Jumbles, Paragraph Summaries, and Odd One Out to keep your logical ordering skills sharp.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs
                                ${isDark ? 'bg-brand-primary-dark text-bg-primary-dark' : 'bg-brand-primary-light text-white'}`}>
                                3
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm sm:text-base mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                    Streak Tracking & Gamified Practice
                                </h3>
                                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                                    Maintain your practice streak to unlock point multipliers, special rank badges, and keep your placement high on the PrepToDo national leaderboard.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Librarian Tip */}
                    <div className={`p-5 rounded-2xl border flex gap-4 my-8
                        ${isDark ? 'border-stat-streak-accent-dark/30 bg-stat-streak-dark/30' : 'border-stat-streak-accent-light/20 bg-stat-streak-light'}`}
                    >
                        <ShieldAlert className={`shrink-0 w-6 h-6 ${isDark ? 'text-stat-streak-accent-dark' : 'text-stat-streak-accent-light'}`} />
                        <div>
                            <h4 className={`font-bold text-sm sm:text-base mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Librarian Tip: The Power of 20 Minutes
                            </h4>
                            <p className="text-xs sm:text-sm leading-relaxed">
                                Practicing VARC for 20 minutes every single day is three times more effective than doing a 3-hour binge study session once a week. Daily exposure forces your brain to build permanent neurological paths for digesting complex prose and structural connections.
                            </p>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="mt-12">
                        <h2 className={`font-serif font-bold text-2xl sm:text-3xl mb-6 text-center ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-3">
                            {faqs.map((faq, index) => (
                                <div key={index} className={`rounded-xl border overflow-hidden ${isDark ? 'border-border-dark bg-bg-secondary-dark' : 'border-border-light bg-white'}`}>
                                    <button
                                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                        className="w-full text-left px-5 py-4 flex justify-between items-center gap-4 cursor-pointer"
                                    >
                                        <span className={`font-semibold text-sm sm:text-base ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                            {faq.q}
                                        </span>
                                        <ChevronDown size={18} className={`shrink-0 transition-transform duration-200 ${expandedFaq === index ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {expandedFaq === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className={`px-5 pb-5 pt-1 text-xs sm:text-sm leading-relaxed border-t border-dashed
                                                    ${isDark ? 'border-border-dark text-text-secondary-dark' : 'border-border-light text-text-secondary-light'}`}>
                                                    {faq.a}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="mt-auto">
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default DailyPracticePage;
