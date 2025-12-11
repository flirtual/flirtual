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

export function initializeAnalytics() {
	Sentry.init({
		enabled: sentryEnabled,
		dsn: sentryDsn,
		sampleRate: 1,
		tracesSampleRate: 1,
		replaysOnErrorSampleRate: 1,
		replaysSessionSampleRate: preview ? 1 : 0,
		tracePropagationTargets: [
			siteOrigin,
			apiOrigin,
		],
		ignoreErrors: [
			"must be caught by a redirect boundary"
		],
		environment: preview || "production",
		sendDefaultPii: !production
	});

	log("Analytics initialized");
}

function Identity() {
	const session = useOptionalSession();

	const userId = session?.user.id || null;
	const optIn = session?.user.preferences?.privacy.analytics || true;

	if (client) {
		Sentry.setTag("native", device.native ? "yes" : "no");
		Sentry.setTag("vision", device.vision ? "yes" : "no");

		Sentry.setUser((userId && optIn) ? { id: userId } : null);
	}

	return null;
}

export function Analytics() {
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
