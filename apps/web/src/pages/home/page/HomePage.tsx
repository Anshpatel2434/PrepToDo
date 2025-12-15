import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAuthStateQuery } from "../../auth/redux_usecases/authApi";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { AuthPopup } from "../../auth/components/AuthPopup";
import { HeroSection } from "../components/HeroSection";
import { IntroductionSection } from "../components/IntroductionSection";
import { FeatureShowcase } from "../components/FeatureShowcase";
import { Footer } from "../components/Footer";

export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { data: authState } = useGetAuthStateQuery();
    
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("theme");
            if (saved) return saved === "dark";
            return window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        return false;
    });

    // Auth popup state
    const [authPopupOpen, setAuthPopupOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

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
        console.log("Auth state:", authState);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("themeChange", handleCustomThemeChange);
        };
    }, [isDark, authState]);

    const handleThemeToggle = () => {
        setIsDark(!isDark);
    };

    const handleNavigate = (path: string, section: string) => {
        // Handle navigation throughout the app
        console.log(`Navigate to ${path} (${section})`);
        
        if (section === "home") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (section === "auth" && path === "/auth") {
            // Navigate to dedicated auth page with background
            navigate("/auth");
        }
    };

    const handleAuthAction = (action: 'signin' | 'signup') => {
        setAuthMode(action);
        if (action === 'signin') {
            navigate("/auth?mode=signin");
        } else {
            navigate("/auth?mode=signup");
        }
    };

    const handleQuickAuth = (action: 'signin' | 'signup') => {
        setAuthMode(action);
        setAuthPopupOpen(true);
    };

    const handleCloseAuthPopup = () => {
        setAuthPopupOpen(false);
    };

    return (
        <div className={`
            min-h-screen transition-colors duration-300
            ${isDark ? 'bg-bg-primary-dark' : 'bg-bg-primary-light'}
        `}>
            {/* Floating Theme Toggle */}
            <FloatingThemeToggle isDark={isDark} onThemeToggle={handleThemeToggle} />

            {/* Floating Navigation */}
            <FloatingNavigation 
                isDark={isDark} 
                onNavigate={handleNavigate}
                isAuthenticated={authState?.isAuthenticated || false}
                user={authState?.user || null}
                onAuthAction={handleAuthAction}
            />

            {/* Main Content */}
            <div className="transition-all duration-500 ease-out">
                {/* Hero Section */}
                <section data-section="home">
                    <HeroSection 
                        isDark={isDark} 
                        isAuthenticated={authState?.isAuthenticated || false}
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
