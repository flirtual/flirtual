import type { init } from "@sentry/nextjs";

import {
	apiOrigin,
	environment,
	sentryDsn,
	sentryEnabled,
	siteOrigin
} from "./const";

/**
 * Sentry configuration, shared between environments.
 */
export const sentryConfig: Parameters<typeof init>[0] = {
	enabled: sentryEnabled,
	dsn: sentryDsn,
	environment: environment === "preview" ? "staging" : environment,
	sampleRate: 1,
	tracesSampleRate: 1,
	profilesSampleRate: 1,
	replaysOnErrorSampleRate: 1,
	replaysSessionSampleRate: 0,
	enableTracing: true,
	tracePropagationTargets: [
		siteOrigin,
		apiOrigin,
	],
	ignoreErrors: []
};
