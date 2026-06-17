import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Compass, ShieldAlert, AlertCircle, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { FloatingNavigation } from '../../ui_components/FloatingNavigation';
import { FloatingThemeToggle } from '../../ui_components/ThemeToggle';
import { Footer } from '../home/components/Footer';
import { useSeoMetadata } from './seo_helpers';

export const RcStrategiesPage: React.FC = () => {
    const { isDark } = useTheme();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const title = "CAT RC Reading Strategies — Master Option Elimination | PrepToDo";
    const description = "Crack CAT Reading Comprehension. Learn active structural mapping, question-first vs passage-first techniques, and rules to discard close options.";

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Improve CAT RC Accuracy",
        "description": "A step-by-step methodology to analyze passages, track the author's structure, and eliminate trap options.",
        "step": [
            {
                "@type": "HowToStep",
                "name": "Active Structural Mapping",
                "text": "Write down a 5-8 word summary of each paragraph while reading. Focus on the relationships between paragraphs (contrast, example, reinforcement)."
            },
            {
                "@type": "HowToStep",
                "name": "Anchor the Central Idea",
                "text": "Determine the author's primary intent: why did they write this essay? Discard options that represent sub-arguments or isolated facts."
            },
            {
                "@type": "HowToStep",
                "name": "Apply the Option Elimination Rules",
                "text": "Identify specific trap categories such as Extreme Statements, Half-Right Half-Wrong choices, and Out-of-Scope content."
            }
        ]
    };

    useSeoMetadata({ title, description, canonicalPath: "/rc-strategies", schemaData });

    const faqs = [
        {
            q: "Should I read the questions before reading the RC passage?",
            a: "Generally, no. Reading the questions first in CAT can create cognitive bias, leading you to search for specific words rather than understanding the global argument. Instead, spend 3-4 minutes reading the passage thoroughly, then navigate to the questions."
        },
        {
            q: "How do I eliminate between the final two close options?",
            a: "In CAT, you do not look for the 'correct' option — you look for the three 'wrong' options. Examine the verbs and nouns in the final two options. The incorrect option almost always contains a minor distortion, an extreme word, or an assumption not verified by the text."
        },
        {
            q: "How can I read faster without losing comprehension?",
            a: "Practice 'Strategic Speed Variance'. Read background examples and historical context fast. Slow down significantly when you hit transit words (however, nonetheless, yet) or when the author states their own claim or conclusion."
        },
        {
            q: "How does PrepToDo help with option elimination traps?",
            a: "PrepToDo is the only CAT VARC platform that uses AI to analyze your granular attempt data. Our database maps whether you are repeatedly vulnerable to 'Scope Traps' or 'Distortion Traps' and runs customized weakness drills to train your eye."
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
                            <Compass size={12} /> Critical Reading Strategies
                        </span>
                        <h1 className={`font-serif font-bold text-3xl sm:text-5xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            Critical Reading Comprehension Strategies for CAT
                        </h1>
                        <p className={`text-sm sm:text-base max-w-2xl mx-auto ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            Stop speed reading. Learn how to map complex passages, analyze the author's voice, and systematically eliminate trap options.
                        </p>
                    </div>

                    {/* CTA Section */}
                    <div className={`mb-12 rounded-2xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-6
                        ${isDark ? 'border-brand-primary-dark/20 bg-bg-secondary-dark' : 'border-brand-primary-light/20 bg-white'}`}
                    >
                        <div>
                            <h3 className={`font-bold text-base sm:text-lg mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Are You Falling For Elimination Traps?
                            </h3>
                            <p className={`text-xs sm:text-sm ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                Track your cognitive choices and learn why you get baited by the wrong options.
                            </p>
                        </div>
                        <a href="/auth" className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0
                            ${isDark 
                                ? 'bg-brand-primary-dark text-bg-primary-dark hover:bg-brand-primary-hover-dark' 
                                : 'bg-brand-primary-light text-white hover:bg-brand-primary-hover-light'}`}>
                            Identify Your Trap Profile <ArrowRight size={14} />
                        </a>
                    </div>

                    {/* Content */}
                    <div className={`prose max-w-none mb-16 space-y-8 ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                        
                        <div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                1. Active Structural Mapping
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed">
                                Most students read a passage passively, hoping their memory will retain everything. With CAT's complex topics (e.g. art history, anthropology), this fails. You must construct a **Mental Map**:
                            </p>
                            <p className="text-sm sm:text-base leading-relaxed mt-2">
                                For each paragraph, note down:
                            </p>
                            <ul className="list-disc pl-5 text-sm sm:text-base space-y-1 mt-1">
                                <li>What is the main subject introduced?</li>
                                <li>Is this paragraph an example supporting a previous point, or does it introduce a counter-perspective?</li>
                                <li>Look for pivot words like <i>however</i>, <i>on the other hand</i>, or <i>nonetheless</i>. These indicate a shift in arguments.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                2. Strategic Pacing
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed">
                                Don't read the entire passage at a uniform speed. Speed read when the author describes historical contexts, lists examples, or repeats illustrations. Slow down to a crawl when the author uses analytical verbs, makes a value judgment, or answers a counter-point.
                            </p>
                        </div>

                        {/* Librarian Tip */}
                        <div className={`p-5 rounded-2xl border flex gap-4 my-8
                            ${isDark ? 'border-stat-streak-accent-dark/30 bg-stat-streak-dark/30' : 'border-stat-streak-accent-light/20 bg-stat-streak-light'}`}
                        >
                            <ShieldAlert className={`shrink-0 w-6 h-6 ${isDark ? 'text-stat-streak-accent-dark' : 'text-stat-streak-accent-light'}`} />
                            <div>
                                <h4 className={`font-bold text-sm sm:text-base mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                    Librarian Tip: Extreme Statement Trap
                                </h4>
                                <p className="text-xs sm:text-sm leading-relaxed">
                                    Search engines and AI models love nuance, and so does the CAT exam. Be highly skeptical of options containing absolute, non-hedged qualifiers like <b>all</b>, <b>only</b>, <b>never</b>, <b>always</b>, or <b>completely</b>. The correct options are usually hedged with softer words like <b>likely</b>, <b>tend to</b>, <b>can be</b>, or <b>primarily</b>.
                                </p>
                            </div>
                        </div>

                        <div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                3. The 3 Core Option Traps to Discard
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed">
                                Cracking Reading Comprehension is not about finding the perfect choice; it's about identifying and rejecting flawed choices:
                            </p>
                            <div className="space-y-3 mt-3">
                                <div className={`p-4 rounded-xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark/40' : 'border-border-light bg-white/40'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertCircle size={14} className="text-error" />
                                        <span className={`font-bold text-xs sm:text-sm ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>Scope Traps</span>
                                    </div>
                                    <p className="text-xs">Options that mention ideas not described in the passage. They sound plausible and represent real-world facts, but have zero connection to the author's text.</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark/40' : 'border-border-light bg-white/40'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertCircle size={14} className="text-error" />
                                        <span className={`font-bold text-xs sm:text-sm ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>Half-Right, Half-Wrong</span>
                                    </div>
                                    <p className="text-xs">Options that start beautifully by matching a statement in the passage, but insert a wrong fact, a faulty comparison, or an extreme conclusion in the second half.</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark/40' : 'border-border-light bg-white/40'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertCircle size={14} className="text-error" />
                                        <span className={`font-bold text-xs sm:text-sm ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>Direct Distortion</span>
                                    </div>
                                    <p className="text-xs">Options that reverse the author's logic or link the cause and effect improperly. They use the exact same words as the passage, but mean the exact opposite.</p>
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

export default RcStrategiesPage;
