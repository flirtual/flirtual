"use client";

import { Slot } from "@radix-ui/react-slot";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, forwardRef, use, useCallback, useEffect, useMemo } from "react";

import { Preferences, type PreferenceTheme } from "~/api/user/preferences";
import { resolveTheme, type Theme } from "~/theme";

import { useDevice } from "./use-device";
import { useMediaQuery } from "./use-media-query";
import { useSession } from "./use-session";

const Context = createContext(
	{} as {
		theme: Theme;
		sessionTheme: PreferenceTheme;
		setTheme: (theme: PreferenceTheme) => void;
	}
);

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
	return use(Context);
}

export const ThemeProvider = forwardRef<
	HTMLHtmlElement,
	{
		children: React.ReactNode;
		theme: PreferenceTheme;
	}
>(({ children, theme: sessionTheme, ...props }, reference) => {
	const [session, mutateSession] = useSession();
	const { vision } = useDevice();
	const router = useRouter();

	const browserTheme = useMediaQuery("(prefers-color-scheme: dark)")
		? "dark"
		: "light";

	const theme = vision
		? "light"
		: sessionTheme === "system"
			? browserTheme
			: sessionTheme;

	const pathname = usePathname();
	const searchParameters = useSearchParams();

	const kind = searchParameters.get("kind");

	const setTheme = useCallback(
		async (theme: PreferenceTheme) => {
			if (!session) return;

			Object.assign(document.documentElement.dataset, {
				theme: resolveTheme(theme)
			});

			await mutateSession({
				...session,
				user: {
					...session.user,
					preferences: await Preferences.update(session.user.id, {
						theme
					})
				}
			});

			router.refresh();
		},
		[session, router, mutateSession]
	);

	useEffect(() => {
		const themeStyle
			= pathname === "/browse" && kind === "friend" ? "friend" : "love";

		Object.assign(document.documentElement.dataset, { themeStyle });
	}, [pathname, kind]);

	useEffect(() => {}, [theme]);

	return (
		<Context
			value={useMemo(() => ({
				theme,
				sessionTheme,
				setTheme
			}), [sessionTheme, setTheme, theme])}
		>
			<Slot {...props} data-theme={theme} ref={reference}>
				{children}
			</Slot>
		</Context>
	);
});

ThemeProvider.displayName = "ThemeProvider";
