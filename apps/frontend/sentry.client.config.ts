// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

import { sentryDsn } from "~/const";

Sentry.init({
	dsn: sentryDsn,
	sampleRate: 1,
	tracesSampleRate: 1,
	replaysOnErrorSampleRate: 1,
	replaysSessionSampleRate: 0.5,
	integrations: [
		new Sentry.Replay({
			maskAllInputs: true
		})
	]
});
