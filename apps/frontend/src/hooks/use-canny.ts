import type { Session } from "~/api/auth";
import { displayName } from "~/api/user";
import type { User } from "~/api/user";
import { cannyAppId } from "~/const";
import { queryClient, sessionKey } from "~/query";
import { urls } from "~/urls";

import { isDesktop } from "./use-screen-breakpoint";

declare global {
	// eslint-disable-next-line vars-on-top
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

export async function openFeedback() {
	await load();

	const session = queryClient.getQueryData<Session>(sessionKey());
	if (session?.user) await identify(session.user);

	location.href = urls.resources.feedback;
}

export async function openChangelog() {
	await load();

	const session = queryClient.getQueryData<Session>(sessionKey());
	if (session?.user) await identify(session.user);

	Canny("initChangelog", {
		appID: cannyAppId,
		position: isDesktop()
			? "bottom"
			: "top",
		align: "left",
		// theme: resolveTheme(sessionTheme)
	});
}

export const closeChangelog = () => Canny("closeChangelog");
