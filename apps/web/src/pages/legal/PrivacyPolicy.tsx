import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { FloatingNavigation } from "../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../ui_components/ThemeToggle";
import { Footer } from "../home/components/Footer";

const PrivacyPolicy: React.FC = () => {
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
                            Privacy Policy
                        </h1>
                        <p className={`text-lg ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            Your data security and privacy is our primary mandate.
                        </p>
                    </div>

                    {/* Content */}
                    <div className={`space-y-12 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>

                        {/* Section 1 */}
                        <section>
                            <h2 className={`font-serif font-bold text-2xl mb-4 flex items-center gap-3 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                I. Introduction
                            </h2>
                            <p className="leading-relaxed">
                                At PrepToDo, accessible from preptodo.in, the privacy of our students is a primary mandate. This Privacy Policy outlines the types of data collected, recorded, and utilized by our Hybrid RAG systems to provide personalized CAT VARC preparation.
                            </p>
                        </section>

                        {/* Section 2 */}
                        <section>
                            <h2 className={`font-serif font-bold text-2xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                II. Consent
                            </h2>
                            <p className="leading-relaxed">
                                By utilizing our website and AI-powered services, you hereby consent to our Privacy Policy and agree to its terms.
                            </p>
                        </section>

                        {/* Section 3 */}
                        <section>
                            <h2 className={`font-serif font-bold text-2xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                III. Information We Collect
                            </h2>
                            <ul className="list-disc pl-6 space-y-3 leading-relaxed">
                                <li>
                                    <strong className={isDark ? "text-text-primary-dark" : "text-text-primary-light"}>Personal Identification:</strong> We collect names and email addresses during account registration.
                                </li>
                                <li>
                                    <strong className={isDark ? "text-text-primary-dark" : "text-text-primary-light"}>Performance Data:</strong> We track and record time spent per passage, accuracy rates, and attempt histories to populate your Performance Dashboard.
                                </li>
                                <li>
                                    <strong className={isDark ? "text-text-primary-dark" : "text-text-primary-light"}>Cognitive Metadata:</strong> Our "Librarian" layer stores mathematical embeddings of your learning patterns and "Weakness-Focused" analytics to curate personalized tests.
                                </li>
                                <li>
                                    <strong className={isDark ? "text-text-primary-dark" : "text-text-primary-light"}>Social & Interaction Logs:</strong> Information shared in study groups, peer challenges, or through the "Teacher" chat API is recorded to improve reasoning accuracy.
                                </li>
                            </ul>
                        </section>

                        {/* Section 4 */}
                        <section>
                            <h2 className={`font-serif font-bold text-2xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                IV. How We Use Your Information
                            </h2>
                            <ul className="list-disc pl-6 space-y-3 leading-relaxed">
                                <li>To personalize AI-curated rationales based on your specific error patterns.</li>
                                <li>To generate "Weakness-Focused" mock exams and practice drills.</li>
                                <li>To maintain leaderboards and social gamification features.</li>
                                <li>To analyze system efficiency and minimize AI hallucinations through knowledge graph validation.</li>
                            </ul>
                        </section>

                        {/* Section 5 */}
                        <section>
                            <h2 className={`font-serif font-bold text-2xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                V. Log Files & Security
                            </h2>
                            <p className="leading-relaxed">
                                PrepToDo follows standard procedures for using log files. This data includes IP addresses, browser types, and timestamps. All performance metrics and "Brain" schema data are stored securely in database with pgvector encryption for semantic data.
                            </p>
                        </section>

                        {/* Section 6 */}
                        <section>
                            <h2 className={`font-serif font-bold text-2xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                VI. Children's Information
                            </h2>
                            <p className="leading-relaxed">
                                PrepToDo does not knowingly collect Personal Identifiable Information from children under the age of 13. If you believe such data has been provided, contact us immediately at <a href="mailto:support@preptodo.in" className="text-brand-primary-light underline">support@preptodo.in</a>.
                            </p>
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

export default PrivacyPolicy;
