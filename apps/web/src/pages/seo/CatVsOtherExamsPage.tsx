import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { FloatingNavigation } from '../../ui_components/FloatingNavigation';
import { FloatingThemeToggle } from '../../ui_components/ThemeToggle';
import { Footer } from '../home/components/Footer';
import { useSeoMetadata } from './seo_helpers';

export const CatVsOtherExamsPage: React.FC = () => {
    const { isDark } = useTheme();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const title = "CAT VARC vs XAT vs SNAP Verbal — Syllabus Comparison | PrepToDo";
    const description = "Compare CAT VARC, XAT Verbal, and SNAP General English. Discover differences in syllabus, question formats, timing, and preparation strategy.";

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "CAT VARC vs XAT Verbal vs SNAP General English Syllabus Comparison",
        "description": "An exhaustive analysis comparing the verbal ability sections of top management entrance tests in India.",
        "author": {
            "@type": "Organization",
            "name": "PrepToDo"
        },
        "publisher": {
            "@type": "Organization",
            "name": "PrepToDo",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.preptodo.in/logo_final_2d_round.png"
            }
        },
        "mainEntityOfPage": "https://www.preptodo.in/cat-vs-other-exams",
        "datePublished": "2026-06-17"
    };

    useSeoMetadata({ title, description, canonicalPath: "/cat-vs-other-exams", schemaData });

    const faqs = [
        {
            q: "Is XAT Verbal ability harder than CAT VARC?",
            a: "Yes, XAT Verbal is widely considered more challenging. In addition to dense Reading Comprehension, XAT features Poem Comprehension, Critical Reasoning questions, and nuanced sentence corrections. However, XAT lacks sectional time limits, allowing you to spend more time per question."
        },
        {
            q: "How should I prepare for SNAP grammar if my primary focus is CAT?",
            a: "Do not start studying grammar early in the year. Focus 100% on CAT RC and logical Verbal Ability until November. In the 3-4 weeks leading up to SNAP, dedicate 30 minutes daily to basic grammar rules (parts of speech, subject-verb agreement, idioms) and figures of speech."
        },
        {
            q: "Does preparing for CAT cover the syllabus for XAT and SNAP?",
            a: "CAT preparation covers approximately 70% of XAT and 50% of SNAP verbal syllabus. For XAT, you need to add poem comprehension, vocabulary, and decision-making prep. For SNAP, you must build speed, learn direct grammar rules, and practice vocabulary synonyms/antonyms."
        },
        {
            q: "How does PrepToDo help candidates preparing for multiple management exams?",
            a: "PrepToDo is the only platform that adapts tests based on target exams. While our core drills focus on CAT's cognitive reasoning, our customized mocks allow you to toggle grammar drills for SNAP and decision-making modules for XAT."
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
                            <AlertCircle size={12} /> Syllabus Comparison Guide
                        </span>
                        <h1 className={`font-serif font-bold text-3xl sm:text-5xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            CAT VARC vs XAT Verbal vs SNAP English
                        </h1>
                        <p className={`text-sm sm:text-base max-w-2xl mx-auto ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            Understanding the syllabus variance, difficulty levels, and pattern shifts between CAT, XAT, and SNAP verbal sections to align your prep.
                        </p>
                    </div>

                    {/* CTA Section */}
                    <div className={`mb-12 rounded-2xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-6
                        ${isDark ? 'border-brand-primary-dark/20 bg-bg-secondary-dark' : 'border-brand-primary-light/20 bg-white'}`}
                    >
                        <div>
                            <h3 className={`font-bold text-base sm:text-lg mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Customize Your Multi-Exam Prep Strategy
                            </h3>
                            <p className={`text-xs sm:text-sm ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                Switch prep modules between CAT critical logic, SNAP grammar drills, and XAT reasoning.
                            </p>
                        </div>
                        <a href="/auth" className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0
                            ${isDark 
                                ? 'bg-brand-primary-dark text-bg-primary-dark hover:bg-brand-primary-hover-dark' 
                                : 'bg-brand-primary-light text-white hover:bg-brand-primary-hover-light'}`}>
                            Get Started Free <ArrowRight size={14} />
                        </a>
                    </div>

                    {/* Comparison Table */}
                    <div className="overflow-x-auto mb-12 rounded-xl border border-border-light dark:border-border-dark">
                        <table className="w-full text-left text-xs sm:text-sm border-collapse">
                            <thead>
                                <tr className={isDark ? 'bg-bg-secondary-dark border-b border-border-dark' : 'bg-gray-100 border-b border-border-light'}>
                                    <th className={`p-4 font-bold ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>Feature</th>
                                    <th className={`p-4 font-bold ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>CAT VARC</th>
                                    <th className={`p-4 font-bold ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>XAT Verbal</th>
                                    <th className={`p-4 font-bold ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>SNAP English</th>
                                </tr>
                            </thead>
                            <tbody className={isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}>
                                <tr className="border-b border-border-light dark:border-border-dark">
                                    <td className="p-4 font-semibold">Total Questions</td>
                                    <td className="p-4">24 Questions</td>
                                    <td className="p-4">26 Questions</td>
                                    <td className="p-4">15 Questions</td>
                                </tr>
                                <tr className="border-b border-border-light dark:border-border-dark">
                                    <td className="p-4 font-semibold">Time Allotted</td>
                                    <td className="p-4">40 Minutes (Sectional)</td>
                                    <td className="p-4">Part of 170 mins (No sectional limit)</td>
                                    <td className="p-4">Part of 60 mins (No sectional limit)</td>
                                </tr>
                                <tr className="border-b border-border-light dark:border-border-dark">
                                    <td className="p-4 font-semibold">Core Focus Areas</td>
                                    <td className="p-4">Reading Comprehension, Para Jumbles, Summary, Odd One Out</td>
                                    <td className="p-4">RCs, Poem Comprehension, Vocabulary, Critical Reasoning</td>
                                    <td className="p-4">Grammar, Fill-in-the-blanks, Synonyms, Figures of Speech</td>
                                </tr>
                                <tr className="border-b border-border-light dark:border-border-dark">
                                    <td className="p-4 font-semibold">Difficulty Level</td>
                                    <td className="p-4">High (Conceptual)</td>
                                    <td className="p-4">Very High (Nuanced/Philosophical)</td>
                                    <td className="p-4">Easy to Moderate (Speed-based)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Content */}
                    <div className={`prose max-w-none mb-16 space-y-8 ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                        
                        <div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                The CAT Philosophy: Logic Over Grammar
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed">
                                CAT VARC does not contain direct vocabulary questions or grammar spot-the-error tests. Instead, it measures how you digest arguments. In RCs, CAT tests your ability to spot logical flows, tone modifications, and primary thesis statements. Even in Verbal Ability (Para Jumbles and Summaries), the focus is purely structural.
                            </p>
                        </div>

                        <div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                The XAT Difference: Philosophical Depth & Poem Comprehension
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed">
                                XAT takes comprehension to the extreme by choosing highly abstract, philosophical passages (often dealing with aesthetics, epistemology, or existentialism). Furthermore, XAT regularly includes a poem and asks questions about its metaphorical meaning, tone, and central message.
                            </p>
                        </div>

                        {/* Librarian Tip */}
                        <div className={`p-5 rounded-2xl border flex gap-4 my-8
                            ${isDark ? 'border-stat-streak-accent-dark/30 bg-stat-streak-dark/30' : 'border-stat-streak-accent-light/20 bg-stat-streak-light'}`}
                        >
                            <ShieldAlert className={`shrink-0 w-6 h-6 ${isDark ? 'text-stat-streak-accent-dark' : 'text-stat-streak-accent-light'}`} />
                            <div>
                                <h4 className={`font-bold text-sm sm:text-base mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                    Librarian Tip: The "Speed vs. Depth Trap"
                                </h4>
                                <p className="text-xs sm:text-sm leading-relaxed">
                                    Avoid applying the same reading strategy across all three exams. CAT requires absolute semantic rigor (verifying every word in options against the passage). SNAP requires rapid pattern recognition (you should answer a grammar question in under 20 seconds). Adjust your mental clock before starting mocks.
                                </p>
                            </div>
                        </div>

                        <div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                The SNAP Blueprint: Pure Speed & Vocab
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed">
                                SNAP is a pure speed-based test. You get 60 questions in 60 minutes across three sections. The English section has no long passages. You are tested on direct grammar rules, spelling, synonyms, active/passive voice, and prepositions. If you know the rule, you tick it; if you don't, you move on immediately.
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

export default CatVsOtherExamsPage;
