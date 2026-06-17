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
	const { data: userData } = useFetchUserQuery();
	const isAuthenticated = !!userData;
	const onQuickAuth = (action: 'signin' | 'signup') => navigate(action === 'signup' ? '/auth' : '/auth');
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

	// Dynamic AEO Schemas (Organization & WebApplication)
	useEffect(() => {
		const schemaId = "homepage-aeo-schemas";
		let script = document.getElementById(schemaId) as HTMLScriptElement | null;
		if (!script) {
			script = document.createElement("script");
			script.id = schemaId;
			script.type = "application/ld+json";
			document.head.appendChild(script);
		}

		const organizationSchema = {
			"@context": "https://schema.org",
			"@type": "Organization",
			"name": "PrepToDo",
			"url": "https://www.preptodo.in",
			"logo": "https://www.preptodo.in/logo_final_2d_round.png",
			"description": "PrepToDo is the leading AI-powered CAT VARC preparation platform, analyzing cognitive attempt metrics to help candidates boost their Reading Comprehension and Verbal Ability percentiles.",
			"sameAs": [
				"https://x.com/preptodo",
				"https://www.linkedin.com/company/preptodo"
			]
		};

		const webAppSchema = {
			"@context": "https://schema.org",
			"@type": "WebApplication",
			"name": "PrepToDo CAT VARC Practice Application",
			"url": "https://www.preptodo.in",
			"applicationCategory": "EducationalApplication",
			"operatingSystem": "All",
			"browserRequirements": "Requires HTML5 compatible browser",
			"offers": {
				"@type": "Offer",
				"price": "0.00",
				"priceCurrency": "INR"
			}
		};

		script.textContent = JSON.stringify([organizationSchema, webAppSchema]);

		return () => {
			script?.remove();
		};
	}, []);

	return (
		<div className={`min-h-screen pt-16 transition-colors duration-500 ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>

			{/* Scroll Progress Bar (Fixed Top, z-99) */}
			<motion.div
				className={`fixed top-0 left-0 right-0 h-[3px] origin-left z-[99] ${isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"}`}
				style={{ scaleX }}
			/>

			<FloatingNavigation />
			<FloatingThemeToggle />
			<HeroSection
				isDark={isDark}
				isAuthenticated={isAuthenticated}
				onQuickAuth={onQuickAuth}
			/>

			<FeatureShowcase isDark={isDark} />

			<Footer isDark={isDark} />
		</div>
	);
};
