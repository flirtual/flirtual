import { captureRequestError, init } from "@sentry/nextjs";

import { environment, sentryDsn } from "~/const";

export const onRequestError = captureRequestError;

export function register() {
	init({
		enabled: environment !== "development",
		environment: environment === "preview" ? "staging" : environment,
		dsn: sentryDsn,
		sampleRate: 1,
		tracesSampleRate: 1,
		enableTracing: false
	});
}
