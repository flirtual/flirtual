// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

import { environment, sentryDsn } from "~/const";

Sentry.init({
	enabled: environment !== "development",
	dsn: sentryDsn,
	sampleRate: 1,
	enableTracing: false,
	tracesSampleRate: 0
});
