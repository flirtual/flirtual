/* eslint-disable react-refresh/only-export-components */
import * as Sentry from "@sentry/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import {
	apiOrigin,
	client,
	cloudflareBeaconId,
	preview,
	production,
	sentryDsn,
	sentryEnabled,
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
		tracesSampleRate: 1,
		replaysOnErrorSampleRate: 1,
		replaysSessionSampleRate: 0,
		tracePropagationTargets: [
			siteOrigin,
			apiOrigin,
		],
		ignoreErrors: [
			"must be caught by a redirect boundary"
		],
		environment: preview || "production",
		integrations: [Sentry.replayIntegration({
			mask: ["[data-mask]"],
			unmask: ["[data-unmask]"],
			block: ["[data-block]"],
			unblock: ["[data-unblock]"],
			ignore: ["[data-ignore]"],
			maskAttributes: ["title", "placeholder", "aria-label", "alt", "href"]
		})]
	});

	log("Monitoring initialized");
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
