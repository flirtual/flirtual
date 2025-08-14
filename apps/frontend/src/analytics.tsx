/* eslint-disable react-refresh/only-export-components */
import * as Sentry from "@sentry/react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import {
	apiOrigin,
	client,
	cloudflareBeaconId,
	production,
	sentryDsn,
	sentryEnabled,
	siteOrigin
} from "~/const";
import { device } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";

export function initialize() {
	Sentry.init({
		enabled: sentryEnabled,
		dsn: sentryDsn,
		sampleRate: 1,
		tracesSampleRate: 1,
		profilesSampleRate: 1,
		replaysOnErrorSampleRate: 0,
		replaysSessionSampleRate: 0,
		tracePropagationTargets: [
			siteOrigin,
			apiOrigin,
		],
		ignoreErrors: [],
	});
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
