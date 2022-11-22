import { useEffect } from "react";

import { useLocalStorage } from "./use-local-storage";

export type Theme = "light" | "dark";

export function useTheme() {
	const [theme, setTheme] = useLocalStorage<Theme>(
		"theme",
		(typeof window !== "undefined" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches &&
			"dark") ||
			"light"
	);

	useEffect(() => {
		if (theme === "dark") return document.documentElement.classList.add("dark");
		document.documentElement.classList.remove("dark");
	}, [theme]);

	return { theme, setTheme };
}
