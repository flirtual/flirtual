import { App } from "@capacitor/app";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { startTransition, StrictMode } from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { apiUrl, appleSigninServiceId } from "./const";
import { device } from "./hooks/use-device";
import { log } from "./log";
import { initializeMonitoring } from "./monitoring";
import { preloadAll } from "./query";
import { isRedirectError } from "./redirect";

App.addListener("appUrlOpen", async (event) => {
	const url = new URL(event.url);
	const href = url.href.replace(url.origin, "");

	location.href = href;
});

initializeMonitoring();

async function initSocialLogin() {
	if (!appleSigninServiceId) return;

	try {
		await SocialLogin.initialize({
			apple: {
				clientId: appleSigninServiceId,
				useProperTokenExchange: true,
				...(device.android && {
					redirectUrl: `${apiUrl}connections/grant?type=apple_android`
				})
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
				},
				onRecoverableError: (reason) => {
					if (isRedirectError(reason) || isRedirectError((reason as { cause?: unknown })?.cause)) return;
					if (typeof reportError === "function") return reportError(reason);
					console.error(reason);
				}
			}
		);
	});
});

log("Client-side hydration complete");
