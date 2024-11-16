import { feedbackIntegration, init, replayIntegration } from "@sentry/nextjs";
// import posthog from "posthog-js";

import {
	apiUrl,
	environment,
	sentryDsn,
	// sentryOrganization,
	// sentryProjectId,
	siteOrigin
} from "~/const";

init({
	// enabled: environment !== "development",
	dsn: sentryDsn,
	environment: environment === "preview" ? "staging" : environment,
	sampleRate: 1,
	tracesSampleRate: 1,
	enableTracing: false,
	replaysOnErrorSampleRate: 1,
	replaysSessionSampleRate: 0,
	ignoreErrors: [
		"ENVIRONMENT_FALLBACK"
	],
	integrations: [
		replayIntegration({
			blockAllMedia: false,
			maskAllText: false,
			maskAllInputs: true,
			mask: ["[data-mask]"],
			block: ["[data-block]"],
			networkDetailAllowUrls: [
				window.location.origin,
				new URL(siteOrigin).origin,
				new URL(apiUrl).origin
			]
		}),
		feedbackIntegration({
			autoInject: false
		}),
		// posthog.sentryIntegration({
		// 	organization: sentryOrganization,
		// 	projectId: sentryProjectId
		// })
	]
});
