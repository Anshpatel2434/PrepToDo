import React, { useEffect, useRef, useState } from "react";
import { useFetchUserQuery } from "../../auth/redux_usecases/authApi";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { AuthPopup } from "../../auth/components/AuthPopup";
import { HeroSection } from "../components/HeroSection";
import { FeatureShowcase } from "../components/FeatureShowcase";
import { Footer } from "../components/Footer";
import { useTheme } from "../../../context/ThemeContext";
import { dailyPracticeApi } from "../../daily/redux_usecase/dailyPracticeApi";
import { useLocation, useNavigate } from "react-router-dom";

export const HomePage: React.FC = () => {
	const { data: authState } = useFetchUserQuery();
	const location = useLocation();
	const navigate = useNavigate();
	const hasScrolled = useRef(false);

	const { isDark } = useTheme();

	// Auth popup state
	const [authPopupOpen, setAuthPopupOpen] = useState(false);
	const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

	useEffect(() => {
		console.log("Auth state:", authState);
	}, [authState]);

	useEffect(() => {
		if (
			location.hash === "#features" &&
			!hasScrolled.current
		) {
			hasScrolled.current = true;

			document
				.querySelector('[data-section="features"]')
				?.scrollIntoView({ behavior: "smooth" });

			// ✅ remove hash after scrolling
			navigate("/home", { replace: true });
		}
	}, [location, navigate]);

	const handleQuickAuth = (action: "signin" | "signup") => {
		setAuthMode(action);
		setAuthPopupOpen(true);
	};

	const handleCloseAuthPopup = () => {
		setAuthPopupOpen(false);
	};

	const { data } =
		dailyPracticeApi.endpoints.fetchDailyTestData.useQueryState();

	useEffect(() => {
		console.log("What the hell is the data stored here : ");
		console.log(data);
	}, [data]);

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
						isAuthenticated={Boolean(authState)}
						onQuickAuth={handleQuickAuth}
					/>
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
