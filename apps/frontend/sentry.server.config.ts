// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

import { sentryDsn } from "~/const";

Sentry.init({
	dsn: sentryDsn,
	sampleRate: 1,
	tracesSampleRate: 0.5
});
