import { useRouter } from "next/navigation";
import { useCallback, useDebugValue } from "react";

import { api } from "~/api";
import { PreferenceTheme } from "~/api/user/preferences";

import { useMediaQuery } from "./use-media-query";
import { useSession } from "./use-session";

export function useTheme() {
	const [session, mutateSession] = useSession();
	const router = useRouter();

	const sessionTheme = session?.user.preferences?.theme ?? "system";
	const browserPrefersDark = useMediaQuery("(prefers-color-scheme: dark)");
	const theme = sessionTheme === "system" ? (browserPrefersDark ? "dark" : "light") : sessionTheme;

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

	return [sessionTheme, setTheme, theme] as const;
}
