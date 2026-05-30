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
		enableLogs: sentryLogs,
		replaysOnErrorSampleRate: 1,
		replaysSessionSampleRate: 0,
		tracePropagationTargets: [
			siteOrigin,
			apiOrigin,
		],
		ignoreErrors: [
			"must be caught by a redirect boundary",
			"Load failed",
			"Failed to fetch",
			"NetworkError when attempting to fetch resource.",
		],
		environment: development ? "development" : (preview || "production"),
		integrations: [
			Sentry.reactRouterTracingIntegration(),
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
