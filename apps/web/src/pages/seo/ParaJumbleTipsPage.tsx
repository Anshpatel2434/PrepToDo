import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { FloatingNavigation } from '../../ui_components/FloatingNavigation';
import { FloatingThemeToggle } from '../../ui_components/ThemeToggle';
import { Footer } from '../home/components/Footer';
import { useSeoMetadata } from './seo_helpers';

export const ParaJumbleTipsPage: React.FC = () => {
    const { isDark } = useTheme();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const title = "How to Solve CAT Para Jumbles — Tips, Rules & Methods | PrepToDo";
    const description = "Learn how to solve CAT Para Jumbles. Master mandatory pairing, noun-pronoun antecedents, and transition word tracking to solve TITA questions.";

    const faqs = [
        {
            q: "How many Para Jumble questions appear in the CAT exam?",
            a: "Typically, the CAT VARC section contains 3 Para Jumble questions. All 3 are usually TITA (Type In The Answer) questions, meaning there are no multiple-choice options provided, and you must enter the exact sequence."
        },
        {
            q: "Is there negative marking for TITA Para Jumbles?",
            a: "No. Since Para Jumbles in CAT are TITA questions, they do not carry any negative marking. This means you should always attempt all of them, even if you are unsure of the sequence."
        },
        {
            q: "What is the Noun-Pronoun Antecedent rule in Para Jumbles?",
            a: "If one sentence contains a pronoun (e.g., 'he', 'they', 'this phenomenon') and another sentence contains the corresponding noun/concept (e.g., 'Dr. Smith', 'inflation'), the sentence containing the noun must precede the sentence containing the pronoun."
        },
        {
            q: "How can I improve my accuracy in TITA Para Jumbles?",
            a: "Do not try to guess the entire sequence at once. Instead, identify 'Mandatory Pairs' (two sentences that must go together). Once you find that 3-1 and 4-2 are linked, you only have a few logical options (e.g., 3-1-4-2, 4-2-3-1, etc.) to evaluate."
        },
        {
            q: "How does PrepToDo's AI Tutor help with Verbal Ability?",
            a: "PrepToDo's semantic Librarian identifies whether your VA errors stem from logical ordering flaws or failure to spot transition pronouns. We build targeted daily Verbal Ability drills tailored to your specific gap."
        }
    ];

    // FAQPage Schema
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map((faq) => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a
            }
        }))
    };

    useSeoMetadata({ title, description, canonicalPath: "/para-jumble-tips", schemaData });

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
                            <HelpCircle size={12} /> Verbal Ability Playbook
                        </span>
                        <h1 className={`font-serif font-bold text-3xl sm:text-5xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            How to Solve CAT Para Jumbles
                        </h1>
                        <p className={`text-sm sm:text-base max-w-2xl mx-auto ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            Master the rules of mandatory pairing, transition clues, and logical ordering to crack TITA (Type In The Answer) Para Jumble questions.
                        </p>
                    </div>

                    {/* CTA Section */}
                    <div className={`mb-12 rounded-2xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-6
                        ${isDark ? 'border-brand-primary-dark/20 bg-bg-secondary-dark' : 'border-brand-primary-light/20 bg-white'}`}
                    >
                        <div>
                            <h3 className={`font-bold text-base sm:text-lg mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Solve Para Jumbles with AI Diagnostics
                            </h3>
                            <p className={`text-xs sm:text-sm ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                Get detailed semantic explanations and drill down on connector rules.
                            </p>
                        </div>
                        <a href="/auth" className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0
                            ${isDark 
                                ? 'bg-brand-primary-dark text-bg-primary-dark hover:bg-brand-primary-hover-dark' 
                                : 'bg-brand-primary-light text-white hover:bg-brand-primary-hover-light'}`}>
                            Practice Para Jumbles <ArrowRight size={14} />
                        </a>
                    </div>

                    {/* Content */}
                    <div className={`prose max-w-none mb-16 space-y-8 ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                        
                        <div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Rule 1: The Mandatory Pair Connector
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed">
                                Never try to arrange all 4 sentences in your head immediately. Your starting point should always be finding <b>Mandatory Pairs</b>. Look for clues that link two sentences together:
                            </p>
                            <ul className="list-disc pl-5 text-sm sm:text-base space-y-1 mt-2">
                                <li><b>Acronym & Full Form:</b> If sentence A mentions the 'World Health Organization' and sentence B mentions 'WHO', A must come before B.</li>
                                <li><b>Definition and Example:</b> A sentence stating a general theory always precedes a sentence giving a concrete example of that theory.</li>
                                <li><b>Transition words:</b> Words like <i>Consequently</i>, <i>Therefore</i>, or <i>As a result</i> signify a direct logical consequence. The cause sentence and result sentence form a mandatory pair.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Rule 2: Tracking Pronoun Antecedents
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed">
                                Pronouns are your best friends in Para Jumbles. If a sentence begins with <i>he</i>, <i>she</i>, <i>it</i>, <i>they</i>, or demonstratives like <i>this research</i> or <i>these events</i>, identify the noun they point to. The sentence introducing the noun must be placed before the pronoun sentence.
                            </p>
                        </div>

                        {/* Librarian Tip */}
                        <div className={`p-5 rounded-2xl border flex gap-4 my-8
                            ${isDark ? 'border-stat-streak-accent-dark/30 bg-stat-streak-dark/30' : 'border-stat-streak-accent-light/20 bg-stat-streak-light'}`}
                        >
                            <ShieldAlert className={`shrink-0 w-6 h-6 ${isDark ? 'text-stat-streak-accent-dark' : 'text-stat-streak-accent-light'}`} />
                            <div>
                                <h4 className={`font-bold text-sm sm:text-base mb-1 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                    Librarian Tip: The "Chronology Clue"
                                </h4>
                                <p className="text-xs sm:text-sm leading-relaxed">
                                    When sentences detail a process, look for time-markers (e.g. <i>initially</i>, <i>afterwards</i>, <i>currently</i>, <i>years ago</i>). A logical flow always maps chronological time sequentially (past ➔ present ➔ future) unless an explicit flashback or theoretical retrospection is introduced.
                                </p>
                            </div>
                        </div>

                        <div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                Rule 3: Finding the Introductory Sentence
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed">
                                The opening sentence of a Para Jumble is almost always **independent**. It introduces a topic, a person, or a premise, and does not require context from other sentences.
                            </p>
                            <p className="text-sm sm:text-base leading-relaxed mt-2">
                                Avoid sentences starting with transition connectors (<i>But</i>, <i>For instance</i>, <i>Hence</i>) or relative pronouns as your opener.
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

export default ParaJumbleTipsPage;
