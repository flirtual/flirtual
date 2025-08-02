import { App } from "@capacitor/app";
import * as Sentry from "@sentry/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { apiOrigin, sentryDsn, sentryEnabled, siteOrigin } from "./const";
import { i18n } from "./i18n";
import type { Locale } from "./i18n";
import { preloadAll, restoreQueries, saveQueries } from "./query";
import { isRedirectError } from "./redirect";
import { urls } from "./urls";

Sentry.init({
	enabled: sentryEnabled,
	dsn: sentryDsn,
	sampleRate: 1,
	tracesSampleRate: 1,
	profilesSampleRate: 1,
	replaysOnErrorSampleRate: 1,
	replaysSessionSampleRate: 0,
	tracePropagationTargets: [
		siteOrigin,
		apiOrigin,
	],
	ignoreErrors: [],
	// integrations: [
	// 	Sentry.replayIntegration({
	// 		blockAllMedia: false,
	// 		maskAllText: false,
	// 		maskAllInputs: true,
	// 		mask: ["[data-mask]"],
	// 		block: ["[data-block]"],
	// 		networkDetailAllowUrls: [
	// 			window.location.origin,
	// 			new URL(siteOrigin).origin,
	// 			new URL(apiUrl).origin
	// 		]
	// 	}),
	// 	Sentry.feedbackIntegration({
	// 		autoInject: false
	// 	})
	// ]
});

App.addListener("appUrlOpen", async (event) => {
	const url = new URL(event.url);
	const pathname = url.href.replace(url.origin, "");

	location.href = pathname;
});

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter />
		</StrictMode>,
		{
			onCaughtError: (error, { componentStack }) => {
				if (isRedirectError(error)) return;
				console.error("onCaught", error instanceof Error
					// Component stack is usually more useful.
					? Object.assign(error, { stack: componentStack || error.stack })
					: error);
			},
			onRecoverableError: (error) => console.error("onRecoverable", error),
			onUncaughtError: (error) => console.error("onUncaught", error),
		}
	);
});

i18n.on("loaded", () => {
	const { t, language } = i18n;

	// eslint-disable-next-line no-console
	console.log(
		`\n%c${t("console_message")}`,
		"padding: 0 0.5rem; background-image: linear-gradient(to right, #ff8975, #e9658b); color: white; white-space: pre; display: block; text-align: center; font-weight: bold; border-radius: .5rem",
		`\n${t("translate")} → ${urls.resources.translate(language as Locale)}\n${t("source_code")} → ${urls.resources.developers}\n\n`
	);
});

await restoreQueries();

window.addEventListener("beforeunload", saveQueries);
document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "visible") return;
	saveQueries();
});

preloadAll();
