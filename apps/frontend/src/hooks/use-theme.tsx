"use client";

import { setPath } from "remeda";

import type { Session } from "~/api/auth";
import { Preferences, type PreferenceTheme } from "~/api/user/preferences";
import { mutate, sessionKey, useMutation } from "~/query";

import { useMediaQuery } from "./use-media-query";
import { usePostpone } from "./use-postpone";
import { useOptionalSession } from "./use-session";

export function useTheme() {
	usePostpone("useTheme()");

	const session = useOptionalSession();
	const sessionTheme = session?.user.preferences?.theme || "system";

	const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

	const theme = sessionTheme === "system"
		? prefersDark
			? "dark"
			: "light"
		: sessionTheme;

	document.documentElement.dataset.theme = theme;

	const { mutateAsync } = useMutation({
		mutationKey: sessionKey(),
		mutationFn: async (theme: PreferenceTheme) => {
			if (!session || theme === sessionTheme) return;

			// await mutate(sessionKey(), { ...session, user: { ...session.user, preferences: { ...session.user.preferences, theme } } });
			const preferences = await Preferences.update(session.user.id, { theme });
			return { ...session, user: { ...session.user, preferences } };
		}
	});

	return [
		theme,
		mutateAsync,
		{
			prefersDark,
			sessionTheme
		}
	] as const;
}
