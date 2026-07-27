import { App } from "@capacitor/app";
import { startTransition, StrictMode } from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { log } from "./log";
import { initializeMonitoring } from "./monitoring";
import { preloadAll } from "./query";
import { isRedirectError } from "./redirect";
import { initializeSocialLogin } from "./social-login";
import { deepLinkToRelativeUrl } from "./urls";

const launchDeepLinkKey = "launch-deep-link-consumed";

let lastDeepLink: string | null = null;

function openDeepLink(value: string) {
	const href = deepLinkToRelativeUrl(value);

	// Native OAuth deep links are consumed by the plugin, not webview navigation.
	if (
		!href
		|| href.startsWith("/oauth-callback")
		|| href.startsWith("/apple-login")
		|| href === lastDeepLink
	) return;

	lastDeepLink = href;
	location.assign(href);
}

App.addListener("appUrlOpen", ({ url }) => openDeepLink(url));

// appUrlOpen misses cold starts: Android only fires it from onNewIntent, iOS can
// drop it before the bridge exists. The launch url persists for the process
// lifetime, so consume it once per webview.
async function openLaunchDeepLink() {
	if (sessionStorage.getItem(launchDeepLinkKey)) return;
	sessionStorage.setItem(launchDeepLinkKey, "1");

	const { url } = await App.getLaunchUrl() ?? {};
	if (url) openDeepLink(url);
}

void openLaunchDeepLink();

initializeMonitoring();

void initializeSocialLogin();

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
