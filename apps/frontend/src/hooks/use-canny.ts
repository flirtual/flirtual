import { useCallback } from "react";

import { displayName, type User } from "~/api/user";
import { urls } from "~/urls";
import { resolveTheme } from "~/theme";
import { cannyAppId } from "~/const";

import { useCurrentUser } from "./use-session";
import { useTheme } from "./use-theme";
import { useScreenBreakpoint } from "./use-screen-breakpoint";

declare global {
	// eslint-disable-next-line no-var
	var Canny: {
		(...arguments_: Array<unknown>): void;
		q: Array<unknown>;
	};
}

if (typeof globalThis.Canny !== "function") {
	globalThis.Canny = Object.assign(
		function () {
			// eslint-disable-next-line prefer-rest-params
			globalThis.Canny.q.push(arguments);
		},
		{ q: [] }
	);
}

const load = () =>
	new Promise<void>((resolve, reject) => {
		if (document.querySelector("#canny-jssdk")) return resolve(undefined);

		const script = document.createElement("script");
		script.src = "https://canny.io/sdk.js";
		script.id = "canny-jssdk";
		script.async = true;

		script.addEventListener("load", () => resolve(undefined));
		script.addEventListener("error", reject);

		document.body.append(script);
	});

const identify = (user: User) =>
	new Promise<void>((resolve) =>
		Canny(
			"identify",
			{
				appID: cannyAppId,
				user: {
					email: user.email,
					name: displayName(user),
					id: user.id,
					avatarURL: urls.userAvatar(user)
				}
			},
			resolve
		)
	);

const closeChangelog = () => Canny("closeChangelog");

export function useCanny() {
	const user = useCurrentUser();
	const { sessionTheme } = useTheme();
	const isMobile = !useScreenBreakpoint("desktop");

	const openFeedback = useCallback(async () => {
		await load();
		if (user) await identify(user);

		location.href = urls.resources.feedback;
	}, [user]);

	const openChangelog = useCallback(async () => {
		await load();
		if (user) await identify(user);

		Canny("initChangelog", {
			appID: cannyAppId,
			position: isMobile ? "top" : "bottom",
			align: "left",
			theme: resolveTheme(sessionTheme)
		});
	}, [user, isMobile, sessionTheme]);

	return { openFeedback, openChangelog, closeChangelog };
}
