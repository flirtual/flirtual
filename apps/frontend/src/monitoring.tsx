/* eslint-disable react-refresh/only-export-components */
import * as Sentry from "@sentry/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import {
	apiOrigin,
	client,
	cloudflareBeaconId,
	development,
	preview,
	production,
	sentryDsn,
	sentryEnabled,
	sentryLogs,
	sentryProfiles,
	sentryTraces,
	siteOrigin
} from "~/const";
import { device } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";

import { log } from "./log";

export function initializeMonitoring() {
	Sentry.init({
		enabled: sentryEnabled,
		dsn: sentryDsn,
		sampleRate: 1,
		tracesSampleRate: sentryTraces,
		profileSessionSampleRate: sentryProfiles,
		profileLifecycle: "trace",
		enableLogs: sentryLogs,
		replaysOnErrorSampleRate: 1,
		replaysSessionSampleRate: 0,
		tracePropagationTargets: [
			siteOrigin,
			apiOrigin,
		],
		ignoreErrors: [
			"Load failed",
			"Failed to fetch",
			"NetworkError when attempting to fetch resource.",
			// Stale-chunk dynamic-import failures — React Router auto-recovers
			// by reloading the page (see loadRouteModule). Engine-specific
			// messages: Safari, Chrome, Firefox.
			"Importing a module script failed.",
			"Failed to fetch dynamically imported module",
			"error loading dynamically imported module",
		],
		environment: development ? "development" : (preview || "production"),
		integrations: [
			Sentry.reactRouterTracingIntegration(),
			Sentry.browserProfilingIntegration(),
			Sentry.replayIntegration({
				mask: ["[data-mask]"],
				unmask: ["[data-unmask]"],
				block: ["[data-block]"],
				unblock: ["[data-unblock]"],
				ignore: ["[data-ignore]"],
				maskAttributes: ["title", "placeholder", "aria-label", "alt", "href"]
			})
		]
	});

	log("Error monitoring initialized");
}

function Identity() {
	const session = useOptionalSession();
	const userId = session?.user.id || null;

	if (client) {
		Sentry.setTag("native", device.native ? "yes" : "no");
		Sentry.setTag("vision", device.vision ? "yes" : "no");
		Sentry.setUser(userId ? { id: userId } : null);
	}

	return null;
}

export function Monitoring() {
	return (
		<>
			<Suspense>
				<ErrorBoundary fallback={null}>
					<Identity />
				</ErrorBoundary>
			</Suspense>
			{production && cloudflareBeaconId && (
				<script
					async
					defer
					data-cf-beacon={JSON.stringify({ token: cloudflareBeaconId })}
					src="https://static.cloudflareinsights.com/beacon.min.js"
				/>
			)}
		</>
	);
}
