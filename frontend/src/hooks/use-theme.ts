import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

function getDefaultTheme(): Theme {
	if (typeof localStorage === "undefined") return "light";

	const query = window.matchMedia("(prefers-color-scheme: dark)");
	return (localStorage.getItem("theme") as Theme) || query.matches ? "dark" : "light";
}

export function useTheme() {
	const [theme, setTheme] = useState<Theme>(getDefaultTheme());

	useEffect(() => {
		const query = window.matchMedia("(prefers-color-scheme: dark)");

		function onThemeChange(event: MediaQueryListEvent) {
			const theme = event.matches ? "dark" : "light";
			localStorage.setItem("theme", theme);
			setTheme(theme);
		}

		query.addEventListener("change", onThemeChange);
		return () => query.removeEventListener("change", onThemeChange);
	}, []);

	useEffect(() => {
		if (theme === "dark") return document.documentElement.classList.add("dark");
		document.documentElement.classList.remove("dark");
	}, [theme]);

	return { theme, setTheme };
}
