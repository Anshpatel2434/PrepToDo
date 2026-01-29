import React from "react";
import { motion } from "framer-motion";
import { BookOpenText, MessageSquareQuote } from "lucide-react";

interface DailyFeatureWidgetProps {
    onStartPractice: (type: "rc" | "va") => void;
    isDark: boolean;
    featureEnabled: boolean;
}

export const DailyFeatureWidget: React.FC<DailyFeatureWidgetProps> = ({
    onStartPractice,
    isDark,
    featureEnabled,
}) => {
    const features = [
        {
            id: "rc",
            title: "Reading Comprehension",
            subtitle: "A Passage with 4 Questions",
            time: "5-10 min",
            questions: "4 Questions",
            icon: BookOpenText,
            // Brand-aligned colors (Teal/Emerald base)
            gradientLight: "from-brand-primary-light/5 to-brand-accent-light/5",
            gradientDark: "from-brand-primary-dark/10 to-brand-accent-dark/10",
            borderColorLight: "border-brand-primary-light/20",
            borderColorDark: "border-brand-primary-dark/20",
            iconBgLight: "bg-brand-primary-light/10",
            iconBgDark: "bg-brand-primary-dark/20",
            iconColorLight: "text-brand-primary-light",
            iconColorDark: "text-brand-primary-dark",
        },
        {
            id: "va",
            title: "Verbal Ability",
            subtitle: "One question of each type",
            time: "5-8 min",
            questions: "4 Questions",
            icon: MessageSquareQuote,
            // Variant using Secondary/Accent for distinction but still on-brand
            gradientLight: "from-brand-secondary-light/5 to-brand-accent-light/5",
            gradientDark: "from-brand-secondary-dark/10 to-brand-accent-dark/10",
            borderColorLight: "border-brand-secondary-light/20",
            borderColorDark: "border-brand-secondary-dark/20",
            iconBgLight: "bg-brand-secondary-light/10",
            iconBgDark: "bg-brand-secondary-dark/20",
            iconColorLight: "text-brand-primary-light", // Unified primary text for consistency
            iconColorDark: "text-brand-primary-dark",
        },
    ];

    return (
        <div className="w-full">
            <h3 className={`text-lg font-semibold mb-4 px-1 flex items-center gap-2 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                <span className={`w-2 h-2 rounded-full ${isDark ? "bg-brand-accent-dark" : "bg-brand-accent-light"}`} />
                Today's Focus
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => {
                    const Icon = feature.icon;

                    return (
                        <motion.button
                            key={feature.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            onClick={() => featureEnabled && onStartPractice(feature.id as "rc" | "va")}
                            disabled={!featureEnabled}
                            className={`
                                relative overflow-hidden rounded-2xl p-5 text-left border card-hover-physics
                                ${featureEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-60"}
                                ${isDark
                                    ? `bg-bg-secondary-dark ${feature.borderColorDark} hover:border-brand-primary-dark/50`
                                    : `bg-white ${feature.borderColorLight} hover:border-brand-primary-light/50`
                                }
                            `}
                        >
                            {/* Detailed Background Gradient */}
                            <div className={`absolute inset-0 bg-linear-to-br ${isDark ? feature.gradientDark : feature.gradientLight} opacity-50`} />

                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <div className={`p-3 rounded-xl inline-flex mb-4 ${isDark ? feature.iconBgDark : feature.iconBgLight}`}>
                                        <Icon className={`w-6 h-6 ${isDark ? feature.iconColorDark : feature.iconColorLight}`} />
                                    </div>

                                    <h4 className={`text-lg font-bold mb-1 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                        {feature.title}
                                    </h4>

                                    <p className={`text-sm mb-4 ${isDark ? "text-text-muted-dark" : "text-text-secondary-light"}`}>
                                        {feature.subtitle}
                                    </p>

                                    <div className="flex items-center gap-3 text-xs font-medium">
                                        <span className={`px-2 py-1 rounded-md border ${isDark ? "bg-bg-tertiary-dark border-white/5 text-text-secondary-dark" : "bg-bg-primary-light border-black/5 text-text-secondary-light"}`}>
                                            {feature.time}
                                        </span>
                                        <span className={`px-2 py-1 rounded-md border ${isDark ? "bg-bg-tertiary-dark border-white/5 text-text-secondary-dark" : "bg-bg-primary-light border-black/5 text-text-secondary-light"}`}>
                                            {feature.questions}
                                        </span>
                                    </div>
                                </div>

                                {featureEnabled && (
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center transition-colors
                                        ${isDark
                                            ? "bg-bg-tertiary-dark text-text-muted-dark group-hover:bg-brand-primary-dark group-hover:text-white"
                                            : "bg-gray-100 text-gray-400 group-hover:bg-brand-primary-light group-hover:text-white"
                                        }
                                    `}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14" />
                                            <path d="m12 5 7 7-7 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
