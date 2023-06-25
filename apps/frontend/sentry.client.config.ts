// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

import { sentryDsn, apiUrl, siteOrigin, environment } from "~/const";

Sentry.init({
	enabled: environment !== "development",
	dsn: sentryDsn,
	sampleRate: 1,
	tracesSampleRate: 0,
	enableTracing: false,
	replaysOnErrorSampleRate: 1,
	replaysSessionSampleRate: 0,
	integrations: [
		new Sentry.Replay({
			blockAllMedia: false,
			maskAllText: false,
			maskAllInputs: true,
			networkDetailAllowUrls: [
				window.location.origin,
				new URL(siteOrigin).origin,
				new URL(apiUrl).origin
			]
		})
	]
});
