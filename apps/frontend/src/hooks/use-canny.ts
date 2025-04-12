import { useCallback } from "react";

import { displayName, type User } from "~/api/user";
import { cannyAppId } from "~/const";
import { sessionKey, unstable_serialize, useSWRConfig } from "~/swr";
import { resolveTheme } from "~/theme";
import { urls } from "~/urls";

import { useScreenBreakpoint } from "./use-screen-breakpoint";
import { useTheme } from "./use-theme";

declare global {
	// eslint-disable-next-line no-var, vars-on-top
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

function load() {
	return new Promise<void>((resolve, reject) => {
		if (document.querySelector("#canny-jssdk")) return resolve(undefined);

		const script = document.createElement("script");
		script.src = "https://canny.io/sdk.js";
		script.id = "canny-jssdk";
		script.async = true;

		script.addEventListener("load", () => resolve(undefined));
		script.addEventListener("error", reject);

		document.body.append(script);
	});
}

function identify(user: User) {
	return new Promise<void>((resolve) =>
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
}

const closeChangelog = () => Canny("closeChangelog");

export function useCanny() {
	const { cache } = useSWRConfig();
	const { sessionTheme } = useTheme();
	const isMobile = !useScreenBreakpoint("desktop");

	const openFeedback = useCallback(async () => {
		await load();

		const { data: session } = cache.get(unstable_serialize(sessionKey())) || {};
		if (session?.user) await identify(session.user);

		location.href = urls.resources.feedback;
	}, [cache]);

	const openChangelog = useCallback(async () => {
		await load();

		const { data: session } = cache.get(unstable_serialize(sessionKey())) || {};
		if (session?.user) await identify(session.user);

		Canny("initChangelog", {
			appID: cannyAppId,
			position: isMobile ? "top" : "bottom",
			align: "left",
			theme: resolveTheme(sessionTheme)
		});
	}, [cache, isMobile, sessionTheme]);

	return { openFeedback, openChangelog, closeChangelog };
}
