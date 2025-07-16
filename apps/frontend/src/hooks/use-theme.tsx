import { useEffect } from "react";

import type { Session } from "~/api/auth";
import { Preferences, type PreferenceTheme } from "~/api/user/preferences";
import { applyDocumentMutations } from "~/app/[locale]/lazy-layout";
import { mutate, queryClient, sessionKey, useMutation } from "~/query";
import type { Theme } from "~/theme";

import { useMediaQuery } from "./use-media-query";
// import { postpone } from "./use-postpone";
import { useOptionalSession } from "./use-session";

export function getTheme(): Theme {
	const session = queryClient.getQueryData<Session | null>(sessionKey());
	const sessionTheme = session?.user.preferences?.theme || "system";

	if (sessionTheme !== "system") return sessionTheme;

	return matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export function useTheme() {
	// postpone("useTheme()");

	const session = useOptionalSession();
	const sessionTheme = session?.user.preferences?.theme || "system";

	const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

	const theme = sessionTheme === "system"
		? prefersDark
			? "dark"
			: "light"
		: sessionTheme;

	useEffect(() => void applyDocumentMutations(), [theme]);

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
