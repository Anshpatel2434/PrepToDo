import React from "react";
import { useTheme } from "../../../context/ThemeContext";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { PracticeFeatureCard } from "../components/PracticeFeatureCard";
import { CalendarCheck, Sliders, Dna, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export const PracticePage: React.FC = () => {
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const practiceFeatures = [
        {
            id: "daily",
            title: "Daily Challenges",
            description: "Targeted, high-yield RC and VA sets crafted daily to sharpen your reasoning skills incrementally.",
            icon: CalendarCheck,
            backgroundIcon: Dna,
            path: "/daily",
            colorConfig: {
                dark: { iconBg: "bg-blue-500/10", iconColor: "text-blue-400", shadow: "shadow-blue-500/10" },
                light: { iconBg: "bg-blue-50", iconColor: "text-blue-600", shadow: "shadow-blue-500/20" }
            }
        },
        {
            id: "customized",
            title: "Customized Sectionals",
            description: "Generate highly adaptive mock tests tailored exactly to your specified weak areas and difficulty bands.",
            icon: Sliders,
            backgroundIcon: Rocket,
            path: "/customized-mocks",
            colorConfig: {
                dark: { iconBg: "bg-purple-500/10", iconColor: "text-purple-400", shadow: "shadow-purple-500/10" },
                light: { iconBg: "bg-purple-50", iconColor: "text-purple-600", shadow: "shadow-purple-500/20" }
            }
        }
    ];

    return (
        <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>

            <FloatingNavigation />
            <FloatingThemeToggle />

            {/* Structured Page Header to frame the content nicely without clutter */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-8">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className={`text-3xl md:text-5xl font-black tracking-tighter ${isDark ? "text-white" : "text-gray-900"}`}>
                        Practice Hub
                    </h1>
                    <p className={`mt-3 text-sm md:text-base font-medium max-w-xl ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        Select a module to begin testing your mastery.
                    </p>
                </motion.div>
                {/* Structural line to ground the header */}
                <div className={`w-full h-px mt-8 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
            </div>


            {/* Moderate Density Grid Container */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pb-24">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mt-8">
                    {practiceFeatures.map((feature, index) => (
                        <PracticeFeatureCard
                            key={feature.id}
                            feature={feature}
                            index={index}
                            isDark={isDark}
                            onClick={() => navigate(feature.path)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
