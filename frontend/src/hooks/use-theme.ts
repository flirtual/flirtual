import { useEffect } from "react";

import { useLocalStorage } from "./use-local-storage";
import { useMediaQuery } from "./use-media-query";

export type Theme = "light" | "dark";

export function useTheme() {
	const mediaDark = useMediaQuery("(prefers-color-scheme: dark)");
	const [theme, setTheme] = useLocalStorage<Theme>("theme", mediaDark ? "dark" : "light");

	useEffect(() => {
		if (theme === "dark") return document.documentElement.classList.add("dark");
		document.documentElement.classList.remove("dark");
	}, [theme]);

	return { theme, setTheme };
}
