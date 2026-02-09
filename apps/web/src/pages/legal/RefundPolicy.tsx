import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { FloatingNavigation } from "../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../ui_components/ThemeToggle";
import { Footer } from "../home/components/Footer";

const RefundPolicy: React.FC = () => {
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

            <div className="min-h-screen overflow-x-hidden px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 pb-10 relative z-10 flex flex-col">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto w-full pb-20 sm:pb-24 grow"
                >
                    {/* Header */}
                    <div className="mb-12 text-center md:text-left">
                        <h1 className={`font-serif font-bold text-3xl md:text-5xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            Refund Policy
                        </h1>
                        <p className={`text-lg ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            Fair and transparent policies for all transactions.
                        </p>
                    </div>

                    {/* Content */}
                    <div className={`space-y-12 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>

                        {/* Section 1 */}
                        <section>
                            <h2 className={`font-serif font-bold text-2xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                I. All Sales Are Final
                            </h2>
                            <p className="leading-relaxed">
                                Once a purchase for a PrepToDo subscription is completed, we do not offer refunds. We provide a range of free resources and previews to allow for an informed, rational purchase decision.
                            </p>
                        </section>

                        {/* Section 2 */}
                        <section>
                            <h2 className={`font-serif font-bold text-2xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                II. Exceptions: Double Payment
                            </h2>
                            <p className="leading-relaxed">
                                In instances of technical error resulting in a duplicate payment, PrepToDo will process a refund for the redundant transaction. Approved refunds will be credited back to the original payment method within standard banking timelines.
                            </p>
                        </section>

                        {/* Section 3 */}
                        <section>
                            <h2 className={`font-serif font-bold text-2xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                III. Technical Issues
                            </h2>
                            <p className="leading-relaxed">
                                If you experience a technical failure preventing access to your purchased materials, contact our support team immediately. We will make every reasonable effort to resolve the issue or provide access to equivalent services.
                            </p>
                        </section>

                        {/* Section 4 */}
                        <section>
                            <h2 className={`font-serif font-bold text-2xl mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                IV. Contact for Refund Queries
                            </h2>
                            <div className={`p-6 rounded-lg border ${isDark ? "bg-bg-tertiary-dark border-border-dark" : "bg-bg-tertiary-light border-border-light"}`}>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-semibold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>WhatsApp:</span>
                                        <span>+91 7046557755</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-semibold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>Email:</span>
                                        <a href="mailto:support@preptodo.in" className="text-brand-primary-light hover:underline">preptodo.app@gmail.com</a>
                                    </div>
                                </div>
                            </div>
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

export default RefundPolicy;
