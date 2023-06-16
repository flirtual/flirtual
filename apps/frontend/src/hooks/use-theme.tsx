"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDebugValue, useEffect, useMemo } from "react";

import { api } from "~/api";
import { PreferenceTheme } from "~/api/user/preferences";

import { useMediaQuery } from "./use-media-query";
import { useSession } from "./use-session";

export function useTheme() {
	const [session, mutateSession] = useSession();
	const router = useRouter();

	const sessionTheme = session?.user.preferences?.theme ?? "light";
	const browserTheme = useMediaQuery("(prefers-color-scheme: dark)")
		? "dark"
		: "light";
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

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
	const { theme } = useTheme();

	const pathname = usePathname();
	const searchParameters = useSearchParams();

	const kind = searchParameters.get("kind");

	useEffect(() => {
		const themeStyle =
			pathname === "/browse" && kind === "friend" ? "friend" : "love";

		Object.assign(document.documentElement.dataset, { themeStyle });
	}, [pathname, kind]);

	useEffect(() => {
		Object.assign(document.documentElement.dataset, { theme });
	}, [theme]);

	return <>{children}</>;
};
