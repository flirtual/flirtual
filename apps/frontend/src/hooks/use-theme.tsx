import type { Session } from "~/api/auth";
import { Preferences } from "~/api/user/preferences";
import type { PreferenceTheme } from "~/api/user/preferences";
import { getPreferences } from "~/preferences";
import { mutate, sessionKey, useMutation } from "~/query";

import { useMediaQuery } from "./use-media-query";
import { usePreferences } from "./use-preferences";
import { getSession } from "./use-session";

export type Theme = "dark" | "light";
export type LocalTheme = "system" | Theme;
export type ThemeStyle = "default" | "friend";

declare global {
	// eslint-disable-next-line vars-on-top
	var theme: Theme;
	// eslint-disable-next-line vars-on-top
	var themeStyle: ThemeStyle;
	// eslint-disable-next-line vars-on-top
	var fontSize: number;
}

export async function getTheme(): Promise<Theme> {
	const localTheme = await getPreferences<PreferenceTheme>("theme") || "system";
	if (localTheme !== "system") return localTheme;

	return globalThis.theme = matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export function useTheme() {
	const [localTheme, setLocalTheme] = usePreferences<PreferenceTheme>("theme", "system");

	// const session = useOptionalSession();
	// const sessionTheme = session?.user.preferences?.theme;

	const prefersDark = useMediaQuery("(prefers-color-scheme: dark)", false);

	const theme = globalThis.theme = localTheme === "system"
		? prefersDark
			? "dark"
			: "light"
		: localTheme;

	const { mutateAsync } = useMutation({
		mutationKey: sessionKey(),
		onMutate: async (theme: PreferenceTheme) => {
			await Promise.all([
				setLocalTheme(theme),
				mutate<Session | null>(sessionKey(), (session) =>
					session
						? ({
								...session,
								user: {
									...session.user,
									preferences: {
										...session.user.preferences,
										theme
									}
								}
							})
						: null)
			]);
		},
		mutationFn: async (theme) => {
			const session = getSession();
			if (!session) return;

			await Preferences.update(session.user.id, { theme });
		},
	});

	return [
		theme,
		mutateAsync,
		{
			prefersDark,
			// sessionTheme,
			localTheme
		}
	] as const;
}
