import React, { useEffect, useState } from "react";
import { useFetchUserQuery } from "../../auth/redux_usecases/authApi";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { AuthPopup } from "../../auth/components/AuthPopup";
import { HeroSection } from "../components/HeroSection";
import { IntroductionSection } from "../components/IntroductionSection";
import { FeatureShowcase } from "../components/FeatureShowcase";
import { Footer } from "../components/Footer";
import { useTheme } from "../../../context/useTheme";

export const HomePage: React.FC = () => {
    const { data: authState } = useFetchUserQuery();

    const { isDark } = useTheme();

    // Auth popup state
    const [authPopupOpen, setAuthPopupOpen] = useState(false);
    const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

    useEffect(() => {
        console.log("Auth state:", authState);
        console.log("Checking comparision : ", authState?.role === "authenticated");
    }, [authState]);

    const handleQuickAuth = (action: "signin" | "signup") => {
        setAuthMode(action);
        setAuthPopupOpen(true);
    };

    const handleCloseAuthPopup = () => {
        setAuthPopupOpen(false);
    };

    return (
        <div
            className={`
            min-h-screen transition-colors duration-300
            ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}
        `}
        >
            {/* Floating Theme Toggle */}
            <FloatingThemeToggle />

            {/* Floating Navigation */}
            <FloatingNavigation />

            {/* Main Content */}
            <div className="transition-all duration-500 ease-out">
                {/* Hero Section */}
                <section data-section="home">
                    <HeroSection
                        isDark={isDark}
                        isAuthenticated={authState?.role === "authenticated" || false}
                        onQuickAuth={handleQuickAuth}
                    />
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

            {/* Auth Popup */}
            <AuthPopup
                isOpen={authPopupOpen}
                onClose={handleCloseAuthPopup}
                isDark={isDark}
                initialMode={authMode}
            />
        </div>
    );
};
