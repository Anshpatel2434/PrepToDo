import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { FloatingNavigation } from "../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../ui_components/ThemeToggle";
import { Footer } from "../home/components/Footer";

const TermsOfService: React.FC = () => {
    const { isDark } = useTheme();

    return (
        <div className={`min-h-screen relative ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
            {/* Background Gradient */}
            <div className={`absolute inset-0 pointer-events-none ${isDark
                ? "bg-linear-to-br from-brand-primary-dark/5 via-transparent to-brand-accent-dark/5"
                : "bg-linear-to-br from-brand-primary-light/5 via-transparent to-brand-accent-light/5"
                }`} />

            <FloatingThemeToggle />
            <FloatingNavigation />

            <div className="min-h-screen overflow-x-hidden pl-18 sm:pl-20 md:pl-24 pr-4 lg:pr-8 py-4 sm:py-6 md:py-10 relative z-10 flex flex-col">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto w-full pb-20 sm:pb-24 grow"
                >
                    {/* Header */}
                    <div className="mb-12 text-center md:text-left">
                        <h1 className={`font-serif font-bold text-3xl md:text-5xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            Terms of Service
                        </h1>
                        <p className={`text-lg ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            Please read our terms carefully before using our platform.
                        </p>
                    </div>

                    {/* Content */}
                    <div className={`space-y-12 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>

                        {/* Section 1 */}
                        <section>
                            <h2 className={`font-serif font-bold text-2xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                I. Overview
                            </h2>
                            <p className="leading-relaxed">
                                This website is operated by PrepToDo. By accessing our platform, you engage in our “Service” and agree to be bound by these Terms of Service.
                            </p>
                        </section>

                        {/* Section 2 */}
                        <section>
                            <h2 className={`font-serif font-bold text-2xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                II. Proprietary Technology & Intellectual Property
                            </h2>
                            <ul className="list-disc pl-6 space-y-3 leading-relaxed">
                                <li>
                                    <strong className={isDark ? "text-text-primary-dark" : "text-text-primary-light"}>The "Brain" Schema:</strong> The multi-relational knowledge graph, logic nodes, and "Reasoning Steps" used to synthesize answers are the exclusive intellectual property of PrepToDo.
                                </li>
                                <li>
                                    <strong className={isDark ? "text-text-primary-dark" : "text-text-primary-light"}>Prohibited Use:</strong> Users are strictly prohibited from using automated tools (crawlers, scrapers) to extract RC passages, proprietary theory chunks, or reverse-engineer the "Factory" ingestion logic.
                                </li>
                                <li>
                                    <strong className={isDark ? "text-text-primary-dark" : "text-text-primary-light"}>Usage Restrictions:</strong> Accounts are for individual use only. We reserve the right to suspend services without a refund if an account is shared or resold.
                                </li>
                            </ul>
                        </section>

                        {/* Section 3 */}
                        <section>
                            <h2 className={`font-serif font-bold text-2xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                III. AI Service Disclaimer
                            </h2>
                            <ul className="list-disc pl-6 space-y-3 leading-relaxed">
                                <li>
                                    <strong className={isDark ? "text-text-primary-dark" : "text-text-primary-light"}>Hybrid RAG Accuracy:</strong> While PrepToDo utilizes a Hybrid RAG system to ensure answers are logically grounded, the Service is provided "as is." We do not warrant that results obtained from the AI "Teacher" will be error-free or meet specific score expectations.
                                </li>
                                <li>
                                    <strong className={isDark ? "text-text-primary-dark" : "text-text-primary-light"}>Content Generation:</strong> AI-generated passages and questions are subject to versioned human review but are primarily provided for simulated practice.
                                </li>
                            </ul>
                        </section>

                    </div>
                </motion.div>

                {/* Footer */}
                <div className="mt-auto">
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
