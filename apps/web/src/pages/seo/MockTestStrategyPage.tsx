import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Award, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { FloatingNavigation } from '../../ui_components/FloatingNavigation';
import { FloatingThemeToggle } from '../../ui_components/ThemeToggle';
import { Footer } from '../home/components/Footer';
import { useSeoMetadata } from './seo_helpers';

export const MockTestStrategyPage: React.FC = () => {
    const { isDark } = useTheme();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const title = "CAT Mock Test Strategy & Verbal Analysis Guide | PrepToDo";
    const description = "Learn the ultimate CAT mock test strategy. Discover the 3-bucket analysis model, time-spent diagnostics, and sectional pacing tips for VARC.";

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Analyze CAT VARC Mock Results",
        "description": "A systematic 3-bucket process to review mock performance, identify timing traps, and reduce silly mistakes.",
        "step": [
            {
                "@type": "HowToStep",
                "name": "Classify Errors into 3 Buckets",
                "text": "Go through each incorrect question and classify it as: Bucket 1 (Silly Mistake/Haste), Bucket 2 (Conceptual Gap), or Bucket 3 (Pacing/Time Trap)."
            },
            {
                "@type": "HowToStep",
                "name": "Analyze Time Spent vs Accuracy",
                "text": "Compare questions where you spent >2.5 minutes with your accuracy. Identify if you have a high hesitation factor."
            },
            {
                "@type": "HowToStep",
                "name": "Implement the Pacing Adjustments",
                "text": "For the next mock, adjust your attempt rate. If accuracy was low, drop targets by 3 questions and spend more time on option elimination."
            }
        ]
    };

    useSeoMetadata({ title, description, canonicalPath: "/mock-test-strategy", schemaData });

    const faqs = [
        {
            q: "How many hours should I spend analyzing a single mock test?",
            a: "A general rule of thumb is to spend twice as much time analyzing the mock as you did writing it. For a 40-minute VARC section, spend at least 80 minutes reviews. Walk through every single question, including the ones you got correct, to verify if your reasoning matched the ideal path."
        },
        {
            q: "Should I attempt all 24 questions in CAT VARC?",
            a: "Rarely. Only top 99.9 percentile scorers attempt all 24 questions. For a 99 percentile, attempting 16-18 questions with 80%+ accuracy is sufficient. Focus on high-accuracy attempts rather than rushing to touch every question."
        },
        {
            q: "How do I deal with a score plateau in mocks?",
            a: "Score plateaus usually occur when you keep practicing without fixing your root cognitive errors. If you keep falling for 'Scope Traps' because you read outside facts into RCs, no amount of mock tests will improve your score. You need to pause, run diagnostics, and do targeted weakness drills."
        },
        {
            q: "How does PrepToDo's Mock Analyzer help?",
            a: "PrepToDo lets you upload your attempt logs and time-spent stats from major institute mocks. Our AI parses the data to map your error taxonomy and feed customized drills directly into your daily practice dashboard to break your score plateau."
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
                            <Award size={12} /> Strategic Mock Playbook
                        </span>
                        <h1 className={`font-serif font-bold text-3xl sm:text-5xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            CAT Mock Test Strategy & Verbal Analysis
                        </h1>
                        <p className={`text-sm sm:text-base max-w-2xl mx-auto ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            Unlock the 3-bucket analysis model. Learn how to map timing data, eliminate careless errors, and structure your 40-minute VARC pacing plan.
                        </p>
                    </div>

                    {/* CTA Section */}
                    <div className={`mb-12 rounded-2xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-6
                        ${isDark ? 'border-brand-primary-dark/20 bg-bg-secondary-dark' : 'border-brand-primary-light/20 bg-white'}`}
                    >
                        <div>
                            <h3 className={`font-bold text-base sm:text-lg mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Analyze Your Mocks with AI Diagnostic
                            </h3>
                            <p className={`text-xs sm:text-sm ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                Input your mock attempts and get an instant map of your cognitive weak points.
                            </p>
                        </div>
                        <a href="/auth" className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0
                            ${isDark 
                                ? 'bg-brand-primary-dark text-bg-primary-dark hover:bg-brand-primary-hover-dark' 
                                : 'bg-brand-primary-light text-white hover:bg-brand-primary-hover-light'}`}>
                            Upload Mock Data <ArrowRight size={14} />
                        </a>
                    </div>

                    {/* Content */}
                    <div className={`prose max-w-none mb-16 space-y-8 ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                        
                        <div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                The 3-Bucket Analysis Model
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed">
                                Most candidates simply look at their final percentile and feel happy or depressed. That is not analysis. When you review your mock verbal section, classify every incorrect and unattempted question into one of three buckets:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div className={`p-4 rounded-xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark/60' : 'border-border-light bg-white/60'}`}>
                                    <h4 className="font-bold text-sm mb-1 text-error">Bucket 1: Haste & carelesness</h4>
                                    <p className="text-xs">Questions where you understood the passage, but rushed options, misread keywords (e.g., 'except', 'incorrect'), or fell for a simple distortion trap. Repair by building option reading patience.</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark/60' : 'border-border-light bg-white/60'}`}>
                                    <h4 className="font-bold text-sm mb-1 text-warning">Bucket 2: Conceptual Gaps</h4>
                                    <p className="text-xs">Questions where you simply didn't understand the passage logic, the vocabulary in context, or couldn't map the logical connections of a Para Jumble. Repair by reviewing theory rules.</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark/60' : 'border-border-light bg-white/60'}`}>
                                    <h4 className="font-bold text-sm mb-1 text-info">Bucket 3: Pacing & Hesitation</h4>
                                    <p className="text-xs">Questions where you spent &gt; 2.5 minutes debating between the final two options and ended up getting it wrong. Repair by learning to skip or guess-and-move-on at 2 minutes.</p>
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
                                    Librarian Tip: The 24-Hour Review Window
                                </h4>
                                <p className="text-xs sm:text-sm leading-relaxed">
                                    Analyze your mock within 24 hours of completing it. If you wait longer, you will forget the exact mental reasoning steps that led you to eliminate a choice or choose a trap. The value of analysis is analyzing your *process*, not just the solution.
                                </p>
                            </div>
                        </div>

                        <div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                The Ideal 40-Minute Sectional Pacing
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed">
                                To maximize your attempts without rushing, structure your time strategically:
                            </p>
                            <div className="space-y-2 mt-3 text-xs sm:text-sm">
                                <div className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-success mt-0.5" />
                                    <span><b>00:00 - 28:00 (RC Focus):</b> Solve 3 Reading Comprehension passages (approx 9 minutes per passage including reading and answering). Skip any passage that feels too dense.</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-success mt-0.5" />
                                    <span><b>28:00 - 37:00 (Verbal Ability):</b> Solve the 8 VA questions (Summary, Odd Sentence, PJs). Tackle TITA questions first since they carry no negative marking.</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-success mt-0.5" />
                                    <span><b>37:00 - 40:00 (Buffer / Sweep):</b> Go back to the skipped RC passage or resolve any flagged questions. Do not start a new passage in these last 3 minutes.</span>
                                </div>
                            </div>
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

export default MockTestStrategyPage;
