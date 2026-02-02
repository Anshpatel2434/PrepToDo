import React, { useEffect, useRef } from "react";
import { useFetchUserQuery } from "../../auth/redux_usecases/authApi";
import { useLocation, useNavigate } from "react-router-dom";
import { HeroSection } from "../components/HeroSection";
import { FeatureShowcase } from "../components/FeatureShowcase";
import { Footer } from "../components/Footer";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { useTheme } from "../../../context/ThemeContext";
import { motion, useScroll, useSpring } from "framer-motion";

export const HomePage: React.FC = () => {
	const { data: authState } = useFetchUserQuery();
	const location = useLocation();
	const navigate = useNavigate();
	const hasScrolled = useRef(false);
	const { isDark } = useTheme();

	// Scroll Progress Logic
	const { scrollYProgress } = useScroll();
	const scaleX = useSpring(scrollYProgress, {
		stiffness: 100,
		damping: 30,
		restDelta: 0.001
	});

	useEffect(() => {
		if (
			location.hash === "#features" &&
			!hasScrolled.current
		) {
			hasScrolled.current = true;
			document
				.querySelector('[data-section="features"]')
				?.scrollIntoView({ behavior: "smooth" });
			navigate("/home", { replace: true });
		}
	}, [location, navigate]);

	return (
		<div className={`min-h-screen transition-colors duration-500 ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>

			{/* Scroll Progress Bar (Fixed Top, z-99) */}
			<motion.div
				className={`fixed top-0 left-0 right-0 h-[3px] origin-left z-[99] ${isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"}`}
				style={{ scaleX }}
			/>

			<FloatingNavigation />
			<FloatingThemeToggle />

			<HeroSection
				isDark={isDark}
				isAuthenticated={!!authState}
				onQuickAuth={(action) => navigate(action === 'signup' ? '/signup' : '/login')}
			/>

			<FeatureShowcase isDark={isDark} />

			<Footer isDark={isDark} />
		</div>
	);
};
