import { App } from "@capacitor/app";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { setupAnalytics } from "./analytics";
import { reportAppOutdated } from "./capacitor";
import { setupMonitoring } from "./monitoring";
import { preloadAll } from "./query";
import { isRedirectError } from "./redirect";
import { initializeSocialLogin } from "./social-login";
import { deepLinkToRelativeUrl } from "./urls";

void setupMonitoring();
void setupAnalytics();

window.addEventListener("unhandledrejection", ({ reason }) => void reportAppOutdated(reason));

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
void initializeSocialLogin();
void preloadAll();

const { searchParams } = new URL(location.href);

if (!searchParams.has("__no_hydrate"))
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
