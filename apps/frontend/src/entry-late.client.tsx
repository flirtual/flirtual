import { App } from "@capacitor/app";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { startTransition, StrictMode } from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { apiUrl, appleSigninServiceId, googleClientId, googleIosClientId } from "./const";
import { device } from "./hooks/use-device";
import { log } from "./log";
import { initializeMonitoring } from "./monitoring";
import { preloadAll } from "./query";
import { isRedirectError } from "./redirect";
import { deepLinkToRelativeUrl } from "./urls";

const launchDeepLinkKey = "launch-deep-link-consumed";

let lastDeepLink: string | null = null;

function openDeepLink(value: string) {
	const href = deepLinkToRelativeUrl(value);

	// OAuth deep links resolve InAppBrowser.openSecureWindow, not navigation.
	if (!href || href.startsWith("/oauth-callback") || href === lastDeepLink) return;

	lastDeepLink = href;
	location.href = href;
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

async function initSocialLogin() {
	if (!appleSigninServiceId && !googleClientId) return;

	try {
		await SocialLogin.initialize({
			...(appleSigninServiceId && {
				apple: {
					clientId: appleSigninServiceId,
					useProperTokenExchange: true,
					...(device.android && {
						redirectUrl: `${apiUrl}connections/grant?type=apple_android`
					})
				}
			}),
			...(googleClientId && {
				google: {
					webClientId: googleClientId,
					mode: "online" as const,
					...(googleIosClientId && {
						iOSClientId: googleIosClientId,
						iOSServerClientId: googleClientId
					})
				}
			})
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
