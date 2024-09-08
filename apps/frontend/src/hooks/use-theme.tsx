"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, forwardRef, use, useCallback, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";

import { resolveTheme, type Theme } from "~/theme";
import { Preferences, type PreferenceTheme } from "~/api/user/preferences";

import { useMediaQuery } from "./use-media-query";
import { useSession } from "./use-session";
import { useDevice } from "./use-device";

const Context = createContext(
	{} as {
		theme: Theme;
		sessionTheme: PreferenceTheme;
		setTheme: (theme: PreferenceTheme) => void;
	}
);

export function useTheme() {
	return use(Context);
}

export const ThemeProvider = forwardRef<
	HTMLHtmlElement,
	{
		children: React.ReactNode;
		theme: PreferenceTheme;
	}
>(({ children, theme: sessionTheme, ...props }, ref) => {
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
		const themeStyle =
			pathname === "/browse" && kind === "friend" ? "friend" : "love";

		Object.assign(document.documentElement.dataset, { themeStyle });
	}, [pathname, kind]);

	useEffect(() => {}, [theme]);

	return (
		<Context.Provider value={{ theme, sessionTheme, setTheme }}>
			<Slot {...props} ref={ref} data-theme={theme}>
				{children}
			</Slot>
		</Context.Provider>
	);
});
