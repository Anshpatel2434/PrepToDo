import React, { useEffect, useState } from "react";

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
        fixed top-6 right-6 z-50 w-14 h-14 rounded-full
        flex items-center justify-center
        transition-all duration-300 ease-out
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${
					isDark
						? "bg-bg-primary-dark hover:bg-surface-750 text-text-primary-dark border border-text-primary-dark"
						: "bg-bg-primary-light hover:bg-surface-100 text-text-primary-light border border-text-primary-light shadow-card"
				}
        ${className}
      `}
			aria-label="Toggle theme"
		>
			{/* Sun Icon */}
			<svg
				className={`absolute w-6 h-6 transition-all duration-300 ${
					isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"
				}`}
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={2}
			>
				<circle cx="12" cy="12" r="4" />
				<path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42" />
			</svg>

			{/* Moon Icon */}
			<svg
				className={`absolute w-6 h-6 transition-all duration-300 ${
					isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"
				}`}
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={2}
			>
				<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
			</svg>
		</button>
	);
};
