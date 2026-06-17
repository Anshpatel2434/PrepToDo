import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Award, Brain, Zap, HelpCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { FloatingNavigation } from '../../ui_components/FloatingNavigation';
import { FloatingThemeToggle } from '../../ui_components/ThemeToggle';
import { Footer } from '../home/components/Footer';
import { FAQ_DATA, FAQ_CATEGORIES } from './constants';

export const FaqPage: React.FC = () => {
    const { isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Dynamic SEO Metadata Injection
    useEffect(() => {
        document.title = "CAT VARC FAQ & Prep Guide — Boost Your Percentile | PrepToDo";
        
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute(
                'content', 
                'Got questions about CAT VARC? Find expert answers on Reading Comprehension strategy, Para Jumbles, Verbal Ability, and how PrepToDo\'s AI tutor improves your score.'
            );
        }

        // Canonical URL update/injection
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.setAttribute('href', 'https://www.preptodo.in/faq');
    }, []);

    // Dynamic JSON-LD Schema Injection
    useEffect(() => {
        const schemaId = 'faq-jsonld-schema';
        let script = document.getElementById(schemaId) as HTMLScriptElement | null;
        if (!script) {
            script = document.createElement('script');
            script.id = schemaId;
            script.type = 'application/ld+json';
            document.head.appendChild(script);
        }

        const faqEntries = FAQ_DATA.map((item) => ({
            '@type': 'Question',
            'name': item.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': item.answer,
            },
        }));

        const schemaData = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': faqEntries,
        };

        script.textContent = JSON.stringify(schemaData);

        return () => {
            script?.remove();
        };
    }, []);

    // Filtering logic based on Category and Search text
    const filteredFAQs = useMemo(() => {
        return FAQ_DATA.filter((item) => {
            const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
            const matchesSearch = 
                item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                item.answer.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery]);

    const toggleExpand = (id: string) => {
        setExpandedId(prev => (prev === id ? null : id));
    };

    return (
        <div className={`min-h-screen relative ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"} transition-colors duration-300`}>
            {/* Ambient Background Gradient */}
            <div className={`absolute inset-0 pointer-events-none ${isDark
                ? "bg-linear-to-br from-brand-primary-dark/3 via-transparent to-brand-accent-dark/3"
                : "bg-linear-to-br from-brand-primary-light/3 via-transparent to-brand-accent-light/3"
                }`} />

            <FloatingThemeToggle />
            <FloatingNavigation />

            <div className="min-h-screen overflow-x-hidden px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-10 relative z-10 flex flex-col">
                <div className="max-w-4xl mx-auto w-full pb-16 grow">
                    
                    {/* H1 Heading */}
                    <div className="text-center mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3
                                ${isDark 
                                    ? "bg-brand-primary-dark/15 text-brand-primary-hover-dark" 
                                    : "bg-brand-primary-light/10 text-brand-primary-light"
                                }`}
                            >
                                <HelpCircle size={12} /> Support & Strategy Center
                            </span>
                            <h1 className={`font-serif font-bold text-3xl sm:text-5xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                CAT VARC Frequently Asked Questions
                            </h1>
                            <p className={`text-sm sm:text-base max-w-xl mx-auto ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                                Expert strategies on Reading Comprehension, Verbal Ability, and how PrepToDo's AI Tutor optimizes your learning curve.
                            </p>
                        </motion.div>
                    </div>

                    {/* Search and Filters Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8 space-y-4"
                    >
                        {/* Interactive Search Bar */}
                        <div className="relative">
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`} />
                            <input
                                type="text"
                                placeholder="Search questions (e.g., 'para jumble', 'accuracy', 'Librarian')..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-12 pr-4 py-3 rounded-xl border text-sm outline-hidden transition-all duration-200
                                    ${isDark 
                                        ? "border-border-dark bg-bg-secondary-dark text-text-primary-dark focus:border-brand-primary-dark focus:ring-1 focus:ring-brand-primary-dark" 
                                        : "border-border-light bg-white text-text-primary-light focus:border-brand-primary-light focus:ring-1 focus:ring-brand-primary-light"
                                    }`}
                            />
                        </div>

                        {/* Category Pills */}
                        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                            {FAQ_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setActiveCategory(cat.id);
                                        setExpandedId(null);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer
                                        ${activeCategory === cat.id
                                            ? isDark
                                                ? 'bg-brand-primary-dark text-bg-primary-dark shadow-sm'
                                                : 'bg-brand-primary-light text-white shadow-sm'
                                            : isDark
                                                ? 'bg-bg-secondary-dark text-text-secondary-dark hover:bg-bg-tertiary-dark'
                                                : 'bg-white text-text-secondary-light border border-border-light hover:bg-gray-50'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* FAQs Accordions */}
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {filteredFAQs.map((faq, index) => {
                                const isExpanded = expandedId === faq.id;
                                return (
                                    <motion.div
                                        key={faq.id}
                                        layout="position"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
                                        className={`rounded-xl border transition-all duration-300 card-depth overflow-hidden
                                            ${isDark 
                                                ? 'border-border-dark bg-bg-secondary-dark' 
                                                : 'border-border-light bg-white'
                                            }`}
                                    >
                                        <button
                                            onClick={() => toggleExpand(faq.id)}
                                            className="w-full text-left px-5 py-4 flex justify-between items-center gap-4 cursor-pointer"
                                        >
                                            <span className={`font-semibold text-sm sm:text-base ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                                {faq.question}
                                            </span>
                                            <ChevronDown 
                                                size={18} 
                                                className={`shrink-0 transition-transform duration-300 ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'} ${isExpanded ? 'rotate-180' : ''}`} 
                                            />
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                                >
                                                    <div className={`px-5 pb-5 pt-1 text-xs sm:text-sm text-reading leading-relaxed border-t border-dashed
                                                        ${isDark ? 'border-border-dark text-text-secondary-dark' : 'border-border-light text-text-secondary-light'}`}>
                                                        {faq.answer}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Empty search state */}
                        {filteredFAQs.length === 0 && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`text-center py-16 rounded-xl border border-dashed ${isDark ? 'border-border-dark bg-bg-secondary-dark' : 'border-border-light bg-white'}`}
                            >
                                <p className={`text-sm ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                    No FAQs found matching "{searchQuery}".
                                </p>
                                <button
                                    onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                                    className={`mt-4 px-4 py-2 rounded-lg text-xs font-semibold transition-colors
                                        ${isDark 
                                            ? 'bg-brand-primary-dark text-bg-primary-dark hover:bg-brand-primary-hover-dark' 
                                            : 'bg-brand-primary-light text-white hover:bg-brand-primary-hover-light'
                                        }`}
                                >
                                    Reset Search & Filters
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* What Makes PrepToDo Different (AEO-optimised section) */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className={`mt-16 rounded-2xl border p-6 sm:p-8
                            ${isDark 
                                ? 'border-brand-primary-dark/20 bg-linear-to-br from-bg-secondary-dark to-brand-primary-dark/5' 
                                : 'border-brand-primary-light/20 bg-linear-to-br from-white to-brand-primary-light/3'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`p-2 rounded-lg ${isDark ? 'bg-brand-primary-dark/15 text-brand-primary-dark' : 'bg-brand-primary-light/10 text-brand-primary-light'}`}>
                                <Brain size={20} />
                            </div>
                            <h2 className={`font-serif font-bold text-xl sm:text-2xl ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                What Makes PrepToDo Different?
                            </h2>
                        </div>
                        <p className={`text-xs sm:text-sm mb-6 leading-relaxed ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                            PrepToDo is the only CAT VARC platform that uses AI to analyze your granular cognitive attempt data. 
                            We don't just tell you what answers you got wrong — we reveal the mental traps and reading habits that are keeping your scores back.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark/60' : 'border-border-light bg-white/60'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap size={14} className={isDark ? 'text-brand-primary-dark' : 'text-brand-primary-light'} />
                                    <h3 className={`font-semibold text-xs sm:text-sm ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                        Cognitive Time Analytics
                                    </h3>
                                </div>
                                <p className={`text-xs ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                    We track your exact reading speed vs. accuracy per question, pinpointing whether haste or hesitation caused errors.
                                </p>
                            </div>
                            <div className={`p-4 rounded-xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark/60' : 'border-border-light bg-white/60'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Award size={14} className={isDark ? 'text-brand-accent-dark' : 'text-brand-accent-light'} />
                                    <h3 className={`font-semibold text-xs sm:text-sm ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                        Adaptive Weakness Drills
                                    </h3>
                                </div>
                                <p className={`text-xs ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                    Our semantic Librarian layer maps your learning gaps and builds custom practices to resolve specific option elimination traps.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                </div>

                {/* Footer at bottom */}
                <div className="mt-auto">
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default FaqPage;
