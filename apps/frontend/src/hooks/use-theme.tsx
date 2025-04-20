"use client";

import { useLocale } from "next-intl";
import { useLayoutEffect } from "react";

import { Preferences, type PreferenceTheme } from "~/api/user/preferences";
import { log } from "~/log";
import { mutate, sessionKey, useMutation } from "~/query";

import { useMediaQuery } from "./use-media-query";
import { usePostpone } from "./use-postpone";
import { useOptionalSession } from "./use-session";

export function useTheme() {
	usePostpone("useTheme()");

	const locale = useLocale();

	const session = useOptionalSession();
	const sessionTheme = session?.user.preferences?.theme || "system";

	const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

	const theme = sessionTheme === "system"
		? prefersDark
			? "dark"
			: "light"
		: sessionTheme;

	useLayoutEffect(() => {
		document.documentElement.dataset.theme = theme;
		// On `locale` change, we any modifications to the document element,
		// so we'll need to re-apply the theme.
	}, [theme, locale]);

	const { mutateAsync } = useMutation({
		mutationKey: sessionKey(),
		onMutate: async (theme: PreferenceTheme) => {
			if (!session || theme === sessionTheme) return;

			await mutate(sessionKey(), {
				...session,
				user: {
					...session.user,
					preferences: {
						...session.user.preferences,
						theme
					}
				}
			});
		},
		mutationFn: async (theme) => {
			if (!session || theme === sessionTheme) return session;

			await Preferences.update(session.user.id, { theme });
			// return { ...session, user: { ...session.user, preferences } };
		},
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
