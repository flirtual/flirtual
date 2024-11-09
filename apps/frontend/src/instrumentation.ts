import * as Sentry from "@sentry/nextjs";

import { environment, sentryDsn } from "~/const";

export const onRequestError = Sentry.captureRequestError;

export function register() {
	Sentry.init({
		enabled: environment !== "development",
		environment: environment === "preview" ? "staging" : environment,
		dsn: sentryDsn,
		sampleRate: 1,
		tracesSampleRate: 1,
		enableTracing: false
	});
}
