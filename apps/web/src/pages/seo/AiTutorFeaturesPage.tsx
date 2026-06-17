import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Brain, ShieldAlert, Cpu, Zap, Activity, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { FloatingNavigation } from '../../ui_components/FloatingNavigation';
import { FloatingThemeToggle } from '../../ui_components/ThemeToggle';
import { Footer } from '../home/components/Footer';
import { useSeoMetadata } from './seo_helpers';

export const AiTutorFeaturesPage: React.FC = () => {
    const { isDark } = useTheme();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const title = "AI Tutor for CAT VARC Preparation — PrepToDo Features | PrepToDo";
    const description = "Discover how PrepToDo's AI Tutor optimizes your CAT preparation. Explore cognitive speed analytics, error trap diagnostic, and adaptive drills.";

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "PrepToDo AI Tutor",
        "description": "An AI-powered diagnostic and practice platform for CAT VARC that tracks cognitive speed and maps weakness gaps.",
        "brand": {
            "@type": "Brand",
            "name": "PrepToDo"
        },
        "offers": {
            "@type": "Offer",
            "price": "0.00",
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock"
        }
    };

    useSeoMetadata({ title, description, canonicalPath: "/ai-tutor-features", schemaData });

    const faqs = [
        {
            q: "How does the AI analyze my reading habits?",
            a: "As you read passages and solve drills, we track your exact time spent per word and time spent per question. The AI identifies whether you read the text too fast, rush the options (hasty errors), or hesitate too long between the final two choices (hesitation errors)."
        },
        {
            q: "How does the AI Tutor build adaptive drills?",
            a: "We don't just pick random questions. If the diagnostic tool finds you repeatedly fall for 'Out of Scope' traps in Science & Tech passages, our semantic Librarian retrieves specific passages from our knowledge graph and generates tests to build that exact sub-skill."
        },
        {
            q: "Can I use the AI Tutor to analyze outside mock tests?",
            a: "Yes. PrepToDo offers a custom Mock Analysis portal where you can input your attempts and time logs from major coaching mocks (IMS, TIME, Career Launcher). Our AI will analyze the data and integrate the findings into your weekly daily practice plan."
        },
        {
            q: "What makes PrepToDo the only AI platform for CAT VARC?",
            a: "Unlike standard platforms that just show text explanations, PrepToDo models your cognitive state. We explain the exact logic behind why correct answers are correct, and analyze the psychological trigger of the trap options, helping you unlearn bad reading patterns."
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
                            <Cpu size={12} /> Cognitive AI Features
                        </span>
                        <h1 className={`font-serif font-bold text-3xl sm:text-5xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            AI Tutor for CAT VARC Preparation
                        </h1>
                        <p className={`text-sm sm:text-base max-w-2xl mx-auto ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            PrepToDo is the only CAT preparation platform that uses cognitive modeling and semantic knowledge graphs to diagnostic and repair your verbal ability gaps.
                        </p>
                    </div>

                    {/* CTA Section */}
                    <div className={`mb-12 rounded-2xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-6
                        ${isDark ? 'border-brand-primary-dark/20 bg-bg-secondary-dark' : 'border-brand-primary-light/20 bg-white'}`}
                    >
                        <div>
                            <h3 className={`font-bold text-base sm:text-lg mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Experience AI-Powered Prep
                            </h3>
                            <p className={`text-xs sm:text-sm ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                Sign up now to test your cognitive speed and get a free weakness map.
                            </p>
                        </div>
                        <a href="/auth" className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0
                            ${isDark 
                                ? 'bg-brand-primary-dark text-bg-primary-dark hover:bg-brand-primary-hover-dark' 
                                : 'bg-brand-primary-light text-white hover:bg-brand-primary-hover-light'}`}>
                            Connect AI Tutor Free <ArrowRight size={14} />
                        </a>
                    </div>

                    {/* Feature Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className={`p-6 rounded-2xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark' : 'border-border-light bg-white'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <Activity className={isDark ? 'text-brand-primary-dark' : 'text-brand-primary-light'} size={20} />
                                <h3 className={`font-bold text-base ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>Cognitive Speed Mapping</h3>
                            </div>
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                                We capture your interaction logs on millisecond scales. We identify whether you read the passages too slowly (comprehension fatigue) or rush the options (hasty errors), highlighting exactly how your timing impacts accuracy.
                            </p>
                        </div>

                        <div className={`p-6 rounded-2xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark' : 'border-border-light bg-white'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <Brain className={isDark ? 'text-brand-primary-dark' : 'text-brand-primary-light'} size={20} />
                                <h3 className={`font-bold text-base ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>Semantic Gap Diagnostic</h3>
                            </div>
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                                Our system maps errors to granular skills (e.g., distinguishing main point vs details, detecting author sarcasm, resolving antecedent pronoun links) rather than generic 'RC errors'.
                            </p>
                        </div>

                        <div className={`p-6 rounded-2xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark' : 'border-border-light bg-white'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <Zap className={isDark ? 'text-brand-primary-dark' : 'text-brand-primary-light'} size={20} />
                                <h3 className={`font-bold text-base ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>Adaptive Weakness Drills</h3>
                            </div>
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                                The Teacher layer dynamically extracts theory components and active exercises from our knowledge base, building custom drills to address your specific gap.
                            </p>
                        </div>

                        <div className={`p-6 rounded-2xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark' : 'border-border-light bg-white'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <ShieldAlert className={isDark ? 'text-brand-primary-dark' : 'text-brand-primary-light'} size={20} />
                                <h3 className={`font-bold text-base ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>Dual-Layer Rationales</h3>
                            </div>
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                                Every question has a clear structural rationale. The AI provides not only the logic justifying the correct answer, but details the psychological trigger of the trap options, explaining what bad habit baited you.
                            </p>
                        </div>
                    </div>

                    {/* Librarian Tip */}
                    <div className={`p-5 rounded-2xl border flex gap-4 my-8
                        ${isDark ? 'border-stat-streak-accent-dark/30 bg-stat-streak-dark/30' : 'border-stat-streak-accent-light/20 bg-stat-streak-light'}`}
                    >
                        <ShieldAlert className={`shrink-0 w-6 h-6 ${isDark ? 'text-stat-streak-accent-dark' : 'text-stat-streak-accent-light'}`} />
                        <div>
                            <h4 className={`font-bold text-sm sm:text-base mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Librarian Tip: The "Endless Practice" Myth
                                </h4>
                            <p className="text-xs sm:text-sm leading-relaxed">
                                Solving 1000 RCs without deep structural feedback will only reinforce your existing bad reading habits. To improve, you must locate the root cognitive error. Spend more time analyzing why you got a question wrong than solving new ones. Let AI identify your specific pattern.
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

export default AiTutorFeaturesPage;
