import { useEffect } from "react";

import type { Session } from "~/api/auth";
import { Preferences, type PreferenceTheme } from "~/api/user/preferences";
import { applyDocumentMutations } from "~/document";
import { getPreferences } from "~/preferences";
import { mutate, sessionKey, useMutation } from "~/query";
import type { Theme } from "~/theme";

import { useMediaQuery } from "./use-media-query";
import { usePreferences } from "./use-preferences";
import { useOptionalSession } from "./use-session";

export async function getTheme(): Promise<Theme> {
	const localTheme = await getPreferences<PreferenceTheme>("theme") || "system";
	if (localTheme !== "system") return localTheme;

	return matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export function useTheme() {
	const [localTheme, setLocalTheme] = usePreferences<PreferenceTheme>("theme", "system");

	const session = useOptionalSession();
	const sessionTheme = session?.user.preferences?.theme;

	const prefersDark = useMediaQuery("(prefers-color-scheme: dark)", false);

	const theme = localTheme === "system"
		? prefersDark
			? "dark"
			: "light"
		: localTheme;

	useEffect(() => void applyDocumentMutations(), [theme]);

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

			await applyDocumentMutations();
		},
		mutationFn: async (theme) => {
			if (!session || theme === sessionTheme) return;
			await Preferences.update(session.user.id, { theme });
		},
	});

	return [
		theme,
		mutateAsync,
		{
			prefersDark,
			sessionTheme,
			localTheme
		}
	] as const;
}
