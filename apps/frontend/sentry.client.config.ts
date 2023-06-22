// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
	tracesSampleRate: 1,
	debug: false,
	replaysOnErrorSampleRate: 1,
	replaysSessionSampleRate: 0.1,
	integrations: [
		new Sentry.Replay({
			maskAllText: true,
			blockAllMedia: true
		})
	]
});
