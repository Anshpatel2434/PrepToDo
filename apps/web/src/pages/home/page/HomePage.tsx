import React, { useEffect, useState } from "react";
import { FloatingNavigation } from "../components/FloatingNavigation";
import { FloatingThemeToggle } from "../components/ThemeToggle";
import { HeroSection } from "../components/HeroSection";
import { IntroductionSection } from "../components/IntroductionSection";
import { FeatureShowcase } from "../components/FeatureShowcase";
import { Footer } from "../components/Footer";

export const HomePage: React.FC = () => {
    const handleNavigate = (path: string, section: string) => {
        // Handle navigation throughout the app
        console.log(`Navigate to ${path} (${section})`);
        // TODO: Implement routing to other pages
        if (section === "home") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("theme");
            if (saved) return saved === "dark";
            return window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        return false;
    });

    // Listen for localStorage changes (from other tabs/windows or other components)
    useEffect(() => {
        // For cross-tab communication
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "theme" && e.newValue) {
                setIsDark(e.newValue === "dark");
            }
        };

        // For same-tab communication via custom event
        const handleCustomThemeChange = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            const newTheme = customEvent.detail;
            const currentTheme = isDark ? "dark" : "light";
            if (newTheme !== currentTheme) {
                setIsDark(newTheme === "dark");
            }
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("themeChange", handleCustomThemeChange);

        console.log("The isDark variable in the HomePage component : ", isDark);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("themeChange", handleCustomThemeChange);
        };
    }, [isDark]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            {/* Floating Theme Toggle */}
            <FloatingThemeToggle />

            {/* Floating Navigation */}
            <FloatingNavigation onNavigate={handleNavigate} />

            {/* Main Content */}
            <div className="transition-all duration-500 ease-out">
                {/* Hero Section */}
                <section data-section="home">
                    <HeroSection isDark={isDark} />
                </section>

                {/* Introduction Section */}
                <section data-section="about">
                    <IntroductionSection isDark={isDark} />
                </section>

                {/* Feature Showcase */}
                <section data-section="features">
                    <FeatureShowcase isDark={isDark} />
                </section>

                {/* Footer */}
                <Footer isDark={isDark} />
            </div>
        </div>
    );
};
