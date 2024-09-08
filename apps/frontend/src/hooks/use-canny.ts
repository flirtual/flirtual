import { useCallback, useEffect } from "react";

import { displayName } from "~/api/user";
import { urls } from "~/urls";
import { resolveTheme } from "~/theme";

import { useCurrentUser } from "./use-session";
import { useTheme } from "./use-theme";
import { useScreenBreakpoint } from "./use-screen-breakpoint";

declare global {
	interface Window {
		Canny: {
			(...arguments_: Array<unknown>): void;
			q: Array<unknown>;
		};
	}
}

const appId = "640785c1023e50169ab5c94a";

let loaded = false;

export function useCanny() {
	const user = useCurrentUser();
	const { sessionTheme } = useTheme();
	const isMobile = !useScreenBreakpoint("desktop");

	const loadCanny = useCallback(() => {
		if (loaded) return;

		const script = document.createElement("script");
		script.src = "https://canny.io/sdk.js";
		script.id = "canny-jssdk";
		script.async = true;

		document.body.append(script);
		loaded = true;
	}, []);

	useEffect(() => {
		if (typeof window.Canny !== "function") {
			window.Canny = Object.assign(
				function () {
					// eslint-disable-next-line prefer-rest-params
					window.Canny.q.push(arguments);
				},
				{ q: [] }
			);
		}
	}, []);

	const identifyUser = useCallback(
		(callback?: () => void) => {
			if (user) {
				window.Canny(
					"identify",
					{
						appID: appId,
						user: {
							email: user.email,
							name: displayName(user),
							id: user.id,
							avatarURL: urls.userAvatar(user)
						}
					},
					callback
				);
			} else if (callback) {
				callback();
			}
		},
		[user]
	);

	const openFeedback = useCallback(() => {
		loadCanny();
		identifyUser(() => {
			window.location.href = urls.resources.feedback;
		});
	}, [identifyUser, loadCanny]);

	const loadChangelog = useCallback(() => {
		loadCanny();
		identifyUser();
		window.Canny("initChangelog", {
			appID: appId,
			position: isMobile ? "top" : "bottom",
			align: "left",
			theme: resolveTheme(sessionTheme)
		});
	}, [identifyUser, isMobile, loadCanny, sessionTheme]);

	return { openFeedback, loadChangelog };
}
