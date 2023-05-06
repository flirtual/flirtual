"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDebugValue, useEffect, useMemo } from "react";

import { api } from "~/api";
import { PreferenceTheme, PreferenceThemes } from "~/api/user/preferences";

import { useMediaQuery } from "./use-media-query";
import { useSession } from "./use-session";

export function useTheme() {
	const [session, mutateSession] = useSession();
	const router = useRouter();

	console.log(session?.user.preferences?.theme);

	const sessionTheme = session?.user.preferences?.theme ?? "light";
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

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
	const { theme } = useTheme();

	const pathname = usePathname();
	const searchParams = useSearchParams();

	const kind = searchParams.get("kind");

	useEffect(() => {
		if (pathname === "/browse" && kind === "friend")
			document.documentElement.classList.add("friend-mode");
		return () => document.documentElement.classList.remove("friend-mode");
	}, [pathname, kind]);

	useEffect(() => {
		document.documentElement.classList.remove(...PreferenceThemes.filter((t) => t !== theme));
		document.documentElement.classList.add(theme);
	}, [theme]);

	return <>{children}</>;
};
