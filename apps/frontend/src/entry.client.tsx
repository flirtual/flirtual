import { App } from "@capacitor/app";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { startTransition, StrictMode } from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { apiUrl, appleSigninServiceId } from "./const";
import { log } from "./log";
import { preloadAll } from "./query";
import { isRedirectError } from "./redirect";

App.addListener("appUrlOpen", async (event) => {
	const url = new URL(event.url);
	const href = url.href.replace(url.origin, "");

	location.href = href;
});

import("./monitoring").then(({ initializeMonitoring }) => initializeMonitoring());

async function initSocialLogin() {
	if (!appleSigninServiceId) return;

	try {
		await SocialLogin.initialize({
			apple: {
				clientId: appleSigninServiceId,
				redirectUrl: `${apiUrl}/connections/grant?type=apple`
			}
		});
		log("SocialLogin initialized");
	}
	catch (reason) {
		console.warn("SocialLogin initialization failed:", reason);
	}
}

void initSocialLogin();

// await restoreQueries();
//
// window.addEventListener("beforeunload", saveQueries);
// document.addEventListener("visibilitychange", () => {
// 	if (document.visibilityState === "visible") return;
// 	saveQueries();
// });
//
preloadAll();
//

// eslint-disable-next-line react-dom/no-flush-sync
flushSync(() => {
	startTransition(() => {
		hydrateRoot(
			document,
			<StrictMode>
				<HydratedRouter />
			</StrictMode>,
			{
				onCaughtError: (reason) => {
					if (isRedirectError(reason)) return;
					console.error(reason);
				}
			}
		);
	});
});

log("Client-side hydration complete");
