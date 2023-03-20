import { useRouter } from "next/navigation";
import { useCallback, useDebugValue, useMemo } from "react";

import { api } from "~/api";
import { PreferenceTheme } from "~/api/user/preferences";

import { useMediaQuery } from "./use-media-query";
import { useSession } from "./use-session";

export function resolveTheme(
	theme: PreferenceTheme = "system"
): Exclude<PreferenceTheme, "system"> {
	return theme === "system"
		? matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light"
		: theme;
}

export function useTheme() {
	const [session, mutateSession] = useSession();
	const router = useRouter();

	const sessionTheme = session?.user.preferences?.theme ?? "system";
	const browserTheme = useMediaQuery("(prefers-color-scheme: dark)") ? "dark" : "light";
	const theme = sessionTheme === "system" ? browserTheme : sessionTheme;

	useDebugValue(theme);

	const setTheme = useCallback(
		async (theme: PreferenceTheme) => {
			if (!session) return;

			const preferences = await api.user.preferences.update(session.user.id, {
				body: {
					theme
				}
			});

			await mutateSession({
				...session,
				user: {
					...session.user,
					preferences
				}
			});

			router.refresh();
		},
		[session, router, mutateSession]
	);

	return useMemo(
		() => ({
			theme,
			sessionTheme,
			browserTheme,
			setTheme
		}),
		[theme, sessionTheme, browserTheme, setTheme]
	);
}
