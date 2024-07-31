import type { PreferenceTheme } from "./api/user/preferences";

export type Theme = Exclude<PreferenceTheme, "system">;

export function resolveTheme(theme: PreferenceTheme = "system"): Theme {
	return theme === "system"
		? matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light"
		: theme;
}
