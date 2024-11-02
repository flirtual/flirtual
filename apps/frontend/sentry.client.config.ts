// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

import { apiUrl, environment, sentryDsn, sentryOrganization, sentryProjectId, siteOrigin } from "~/const";

Sentry.init({
	enabled: environment !== "development",
	dsn: sentryDsn,
	sampleRate: 1,
	tracesSampleRate: 1,
	enableTracing: false,
	replaysOnErrorSampleRate: 1,
	replaysSessionSampleRate: 0,
	integrations: [
		Sentry.replayIntegration({
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
		Sentry.feedbackIntegration({
			autoInject: false
		}),
		posthog.sentryIntegration({
			organization: sentryOrganization,
			projectId: sentryProjectId
		})
	]
});
