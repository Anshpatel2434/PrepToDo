import React, { useEffect, useState } from "react";
import { AiFillSun } from "react-icons/ai";
import { AiFillMoon } from "react-icons/ai";

// ============================================================================
// THEME TOGGLE COMPONENT
// ============================================================================
export const FloatingThemeToggle: React.FC<{ className?: string }> = ({
	className = "",
}) => {
	const [isDark, setIsDark] = useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("theme");
			if (saved) return saved === "dark";
			return window.matchMedia("(prefers-color-scheme: dark)").matches;
		}
		return false;
	});

	useEffect(() => {
		if (isDark) {
			document.documentElement.classList.add("dark");
			localStorage.setItem("theme", "dark");
		} else {
			document.documentElement.classList.remove("dark");
			localStorage.setItem("theme", "light");
		}
		// Dispatch custom event after updating localStorage
		window.dispatchEvent(
			new CustomEvent("themeChange", { detail: isDark ? "dark" : "light" })
		);
	}, [isDark]);

	return (
		<button
			onClick={() => setIsDark(!isDark)}
			className={`
      fixed top-6 right-6 z-50 w-12 h-12 rounded-2xl
      flex items-center justify-center
      transition-all duration-300 ease-out
      hover:scale-110
      backdrop-blur-md bg-white/10
      hover:cursor-pointer
      ${
				isDark
					? "bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.4)] focus:ring-indigo-400"
					: "bg-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.4)] focus:ring-orange-400"
			}
      ${className}
    `}
			aria-label="Toggle theme"
		>
			{/* Sun Icon - shown in light mode */}
			{!isDark && (
				<AiFillSun className="text-orange-500 text-2xl transition-all duration-300 hover:rotate-90" />
			)}

			{/* Moon Icon - shown in dark mode */}
			{isDark && (
				<AiFillMoon className="text-indigo-400 text-2xl transition-all duration-300 hover:-rotate-12" />
			)}
		</button>
	);
};
