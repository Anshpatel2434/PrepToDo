import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthPopup } from "../components/AuthPopup";
import { useFetchUserQuery } from "../redux_usecases/authApi";

// This component handles the /auth route with background
export const AuthPage: React.FC = () => {
	const location = useLocation();
	const [authPopupOpen, setAuthPopupOpen] = useState(true);
	const navigate = useNavigate();
	const { data: user } = useFetchUserQuery();

	// Redirect admin users to admin dashboard after login
	useEffect(() => {
		if (user && user.role === 'admin') {
			navigate('/admin/dashboard', { replace: true });
		}
	}, [user, navigate]);

	// Get initial mode from URL params
	const searchParams = new URLSearchParams(location.search);
	const initialMode =
		(searchParams.get("mode") as "signin" | "signup") || "signin";

	//this is to redirect the user once we get back from the google signin page
	useEffect(() => {
		// Supabase will hydrate session automatically here
		if (localStorage.getItem("post_auth_redirect")) {
			const storedRedirect = localStorage.getItem("post_auth_redirect") || "/";
			localStorage.removeItem("post_auth_redirect");

			// Auth paths to filter out
			const authPaths = ['/auth', '/auth/', '/auth/callback', '/auth/reset-password'];
			const normalized = storedRedirect.toLowerCase().split('?')[0];
			const isAuthPath = authPaths.some(p => normalized === p || normalized.startsWith('/auth/'));

			// Redirect to stored path if valid, otherwise dashboard
			const redirectTo = isAuthPath ? '/dashboard' : storedRedirect;
			navigate(redirectTo, { replace: true });
		}
	}, [navigate]);

	// Theme detection using useMemo to avoid setState in effects
	const initializeTheme = useMemo(() => {
		return () => {
			if (typeof window !== "undefined") {
				const saved = localStorage.getItem("theme");
				return saved
					? saved === "dark"
					: window.matchMedia("(prefers-color-scheme: dark)").matches;
			}
			return false;
		};
	}, []);

	const [isDark, setIsDark] = useState(initializeTheme());

	// Listen for theme changes
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "theme" && e.newValue) {
				setIsDark(e.newValue === "dark");
			}
		};

		const handleCustomThemeChange = (e: Event) => {
			const customEvent = e as CustomEvent<string>;
			const newTheme = customEvent.detail;
			setIsDark(newTheme === "dark");
		};

		window.addEventListener("storage", handleStorageChange);
		window.addEventListener("themeChange", handleCustomThemeChange);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
			window.removeEventListener("themeChange", handleCustomThemeChange);
		};
	}, [setIsDark]);

	const handleClosePopup = () => {
		setAuthPopupOpen(false);
		// Navigate back to home or previous page
		window.history.back();
	};

	return (
		<div
			className={`
      min-h-screen transition-colors duration-300
      ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}
    `}
		>
			{/* Background decoration */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{/* Animated background orbs */}
				<motion.div
					animate={{
						y: [0, -30, 0],
						x: [0, 20, 0],
						scale: [1, 1.1, 1],
					}}
					transition={{
						duration: 8,
						repeat: Infinity,
						ease: "easeInOut",
					}}
					className={`
            absolute top-1/4 left-1/4 w-32 h-32 rounded-full opacity-20
            ${isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"}
          `}
				/>

				<motion.div
					animate={{
						y: [0, 20, 0],
						x: [0, -15, 0],
						scale: [1, 0.9, 1],
					}}
					transition={{
						duration: 6,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 2,
					}}
					className={`
            absolute top-3/4 right-1/4 w-24 h-24 rounded-full opacity-20
            ${isDark ? "bg-brand-accent-dark" : "bg-brand-accent-light"}
          `}
				/>

				<motion.div
					animate={{
						y: [0, -20, 0],
						x: [0, 10, 0],
						rotate: [0, 180, 360],
					}}
					transition={{
						duration: 10,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 4,
					}}
					className={`
            absolute top-1/2 right-1/3 w-16 h-16 rounded-full opacity-10
            ${isDark ? "bg-brand-secondary-dark" : "bg-brand-secondary-light"}
          `}
				/>
			</div>

			{/* Auth Popup */}
			<AuthPopup
				isOpen={authPopupOpen}
				onClose={handleClosePopup}
				isDark={isDark}
				initialMode={initialMode}
			/>
		</div>
	);
};
