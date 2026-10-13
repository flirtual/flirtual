import { App } from "@capacitor/app";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { setupAnalytics } from "./analytics";
import { reportAppOutdated } from "./capacitor";
import { followLaunchDeepLink, openDeepLink } from "./hooks/use-deep-links";
import { setupMonitoring } from "./monitoring";
import { clearNativeActions } from "./native-navigation";
import { preloadAll } from "./query";
import { isRedirectError } from "./redirect";
import { initializeSocialLogin } from "./social-login";

import "./hooks/use-back-button";

void setupMonitoring();
void setupAnalytics();

window.addEventListener("unhandledrejection", ({ reason }) => void reportAppOutdated(reason));

clearNativeActions();
void initializeSocialLogin();
void preloadAll();

async function start() {
	const { searchParams } = new URL(location.href);
	if (searchParams.has("__no_hydrate")) return;

	// Before listening, so a link the app was opened with starts it there rather than navigating once
	// it has.
	const redirecting = await followLaunchDeepLink() === "redirecting";
	void App.addListener("appUrlOpen", ({ url }) => openDeepLink(url));
	if (redirecting) return;

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
}

void start();
