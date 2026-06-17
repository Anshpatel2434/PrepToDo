import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BookOpen, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { FloatingNavigation } from '../../ui_components/FloatingNavigation';
import { FloatingThemeToggle } from '../../ui_components/ThemeToggle';
import { Footer } from '../home/components/Footer';
import { useSeoMetadata } from './seo_helpers';

export const VarcGuidePage: React.FC = () => {
    const { isDark } = useTheme();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const title = "CAT VARC Preparation Guide 2025 — Step-by-Step strategy | PrepToDo";
    const description = "Master CAT VARC with our 2025 preparation guide. Explore active reading strategies, question taxonomies, error tracking, and AI-driven drills.";
    
    // JSON-LD Schemas: Article + HowTo
    const schemaData = [
        {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Complete CAT VARC Preparation Guide 2025",
            "description": "A comprehensive, data-driven guide to cracking the Reading Comprehension and Verbal Ability section of the CAT exam.",
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
            "mainEntityOfPage": "https://www.preptodo.in/varc-guide",
            "datePublished": "2026-06-17"
        },
        {
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Prepare for CAT VARC 2025",
            "description": "Three phases to systematically build vocabulary, comprehension depth, option-elimination skills, and mock test pacing.",
            "step": [
                {
                    "@type": "HowToStep",
                    "name": "Establish Reading Habits",
                    "text": "Read diverse essays from Aeon, The Guardian, and Aldaily for 45 minutes daily to adapt to complex academic prose."
                },
                {
                    "@type": "HowToStep",
                    "name": "Master Question Taxonomy & Traps",
                    "text": "Analyze CAT past year questions to classify question types (Inference, Central Idea, Tone) and identify option traps."
                },
                {
                    "@type": "HowToStep",
                    "name": "Execute Time-Boxed Drills",
                    "text": "Solve 4 RCs and 10 VA questions in 40 minutes, tracking cognitive speed and error patterns daily."
                }
            ]
        }
    ];

    useSeoMetadata({ title, description, canonicalPath: "/varc-guide", schemaData });

    const faqs = [
        {
            q: "How long does it take to see improvement in CAT VARC?",
            a: "VARC improvement is non-linear. Typically, it takes 6-8 weeks of consistent active reading and systematic error tracking to see stable percentile gains. Focus on analyzing your elimination errors rather than just solving more passages."
        },
        {
            q: "Should I study extensive grammar and vocabulary lists for CAT?",
            a: "No. Unlike other management exams, CAT rarely tests direct grammar or vocabulary definitions. Vocabulary is tested in-context. Spend your time understanding complex sentence structures and semantic links instead of memorizing flashcards."
        },
        {
            q: "What is the ideal attempt rate and accuracy in VARC?",
            a: "For a 99+ percentile, aim for 16-18 attempts with 80%+ accuracy (approx 36-40 net score). If accuracy is low, scale down attempts to 12-14 and focus purely on discarding close trap options."
        },
        {
            q: "How does PrepToDo's AI Tutor help in VARC preparation?",
            a: "PrepToDo is the only CAT VARC platform that uses AI to analyze your granular attempt metrics. We track your reading speed vs. accuracy per question, pinpointing whether haste or hesitation caused errors, and build customized weakness drills."
        }
    ];

    return (
        <div className={`min-h-screen relative ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"} transition-colors duration-300`}>
            {/* Background Gradients */}
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
                            <BookOpen size={12} /> Evergreen Preparation Playbook
                        </span>
                        <h1 className={`font-serif font-bold text-3xl sm:text-5xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            Complete CAT VARC Preparation Guide 2025
                        </h1>
                        <p className={`text-sm sm:text-base max-w-2xl mx-auto ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            A data-backed, phase-wise roadmap to crack Reading Comprehension & Verbal Ability. Learn how to transition from random practice to cognitive analytics.
                        </p>
                    </div>

                    {/* Quick CTA Card */}
                    <div className={`mb-12 rounded-2xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-6
                        ${isDark ? 'border-brand-primary-dark/20 bg-bg-secondary-dark' : 'border-brand-primary-light/20 bg-white'}`}
                    >
                        <div>
                            <h3 className={`font-bold text-base sm:text-lg mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Diagnose Your VARC Weaknesses Today
                            </h3>
                            <p className={`text-xs sm:text-sm ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                Get an instant breakdown of your reading speed, trap vulnerability, and accuracy profile.
                            </p>
                        </div>
                        <a href="/auth" className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0
                            ${isDark 
                                ? 'bg-brand-primary-dark text-bg-primary-dark hover:bg-brand-primary-hover-dark' 
                                : 'bg-brand-primary-light text-white hover:bg-brand-primary-hover-light'}`}>
                            Start Free Diagnostics <ArrowRight size={14} />
                        </a>
                    </div>

                    {/* Content Section */}
                    <div className={`prose max-w-none mb-16 space-y-8 ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                        
                        <div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Phase 1: Building Active Reading Stamina (Months 1-2)
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed">
                                The biggest mistake aspirants make is jump straight into solving 5 RCs a day. Without reading stamina, you will suffer cognitive fatigue around the 3rd passage. Start by reading **high-density essays** for 45 minutes daily.
                            </p>
                            <ul className="list-disc pl-5 text-sm sm:text-base space-y-1 mt-2">
                                <li><strong>Aeon Essays:</strong> Focus on philosophy, psychology, and science history.</li>
                                <li><strong>The Economist / ALDaily:</strong> Read editorial opinions to get used to diverse authors' arguments.</li>
                                <li><strong>Active Annotation:</strong> While reading, write down a single-line summary of each paragraph to force comprehension.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Phase 2: Mastering the Question-Type Taxonomy (Months 3-4)
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed">
                                CAT VARC doesn't check speed reading; it checks critical reasoning. You must learn to classify questions and know how to target their answers:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                <div className={`p-4 rounded-xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark/60' : 'border-border-light bg-white/60'}`}>
                                    <h4 className={`font-bold text-sm mb-1 ${isDark ? 'text-brand-primary-dark' : 'text-brand-primary-light'}`}>Inference Questions</h4>
                                    <p className="text-xs">Require you to identify claims that are logically implied by the text, but not explicitly stated. Beware of extreme extrapolations.</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark/60' : 'border-border-light bg-white/60'}`}>
                                    <h4 className={`font-bold text-sm mb-1 ${isDark ? 'text-brand-primary-dark' : 'text-brand-primary-light'}`}>Central Idea Questions</h4>
                                    <p className="text-xs">Ask for the overall thesis. Avoid options that focus on sub-points or narrow examples from a single paragraph.</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark/60' : 'border-border-light bg-white/60'}`}>
                                    <h4 className={`font-bold text-sm mb-1 ${isDark ? 'text-brand-primary-dark' : 'text-brand-primary-light'}`}>Tone / Style Questions</h4>
                                    <p className="text-xs">Assess the author's attitude. Options like "biased" or "neutral" are rarely correct compared to nuanced terms like "analytical".</p>
                                </div>
                            </div>
                        </div>

                        {/* Librarian Tip Block */}
                        <div className={`p-5 rounded-2xl border flex gap-4 my-8
                            ${isDark ? 'border-stat-streak-accent-dark/30 bg-stat-streak-dark/30' : 'border-stat-streak-accent-light/20 bg-stat-streak-light'}`}
                        >
                            <ShieldAlert className={`shrink-0 w-6 h-6 ${isDark ? 'text-stat-streak-accent-dark' : 'text-stat-streak-accent-light'}`} />
                            <div>
                                <h4 className={`font-bold text-sm sm:text-base mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                    Librarian Tip: The "Wikipedia Trap"
                                </h4>
                                <p className="text-xs sm:text-sm leading-relaxed">
                                    Avoid studying facts about the passages. When solving an RC, your external knowledge is your greatest liability. If a passage claims the earth is flat, treat it as absolute truth for those 4 questions. Discard options that introduce outside factual truths not validated by the text.
                                </p>
                            </div>
                        </div>

                        <div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Phase 3: Pacing Drills & Cognitive Weakness Analytics (Months 5-6)
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed">
                                Once your foundation is strong, transition to time-boxed drills. Solve 4 RCs and 10 Verbal Ability questions (Para Jumbles, Summaries, Odd Sentence) in exactly 40 minutes.
                            </p>
                            <p className="text-sm sm:text-base leading-relaxed mt-2">
                                PrepToDo is the only CAT VARC platform that tracks your cognitive metrics to help you optimize:
                            </p>
                            <div className="space-y-2 mt-2">
                                <div className="flex items-start gap-2 text-xs sm:text-sm">
                                    <CheckCircle size={14} className="text-success mt-0.5 shrink-0" />
                                    <span><strong>Hesitation Analysis:</strong> Identifies questions where you spent &gt; 2.5 minutes but still got them wrong. Usually, it's better to skip these.</span>
                                </div>
                                <div className="flex items-start gap-2 text-xs sm:text-sm">
                                    <CheckCircle size={14} className="text-success mt-0.5 shrink-0" />
                                    <span><strong>Trap Profiling:</strong> Automatically classifies whether you fall for "Out of Scope" or "Direct Distortion" traps.</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* FAQ Section */}
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

export default VarcGuidePage;
