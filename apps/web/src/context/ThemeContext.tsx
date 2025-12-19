import { useEffect, useState } from "react";
import { ThemeContext, type Theme } from "./themeContext";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState<Theme>(() => {
		return (localStorage.getItem("theme") as Theme) || "light";
	});

	useEffect(() => {
		localStorage.setItem("theme", theme);
	}, [theme]);

	const toggleTheme = () => {
		setTheme((prev) => (prev === "dark" ? "light" : "dark"));
	};

	return (
		<ThemeContext.Provider
			value={{
				theme,
				isDark: theme === "dark",
				toggleTheme,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
}
