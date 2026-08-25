import {
	browserProfilingIntegration,
	getGlobalScope,
	init,
	reactRouterTracingIntegration,
	replayIntegration,
	spanStreamingIntegration
} from "@sentry/react-router";

import {
	apiOrigin,
	development,
	preview,
	sentryDsn,
	sentryLogs,
	sentryProfiles,
	sentryTraces,
	siteOrigin
} from "~/const";
import { device } from "~/hooks/use-device";

export function setupMonitoring() {
	init({
		dsn: sentryDsn,
		environment: development
			? "development"
			: preview
				? "preview"
				: "production",

		sampleRate: 1,

		tracesSampleRate: sentryTraces,
		profileSessionSampleRate: sentryProfiles,

		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: 1,

		enableLogs: sentryLogs,

		profileLifecycle: "trace",
		traceLifecycle: "stream",

		tracePropagationTargets: [
			siteOrigin,
			apiOrigin,
		],

		ignoreErrors: [
			"Load failed",
			"Failed to fetch",
			"NetworkError when attempting to fetch resource.",
			// Stale-chunk dynamic-import failures — React Router auto-recovers
			// by reloading the page (see loadRouteModule). Engine-specific
			// messages: Safari, Chrome, Firefox.
			"Importing a module script failed.",
			"Failed to fetch dynamically imported module",
			"error loading dynamically imported module",
		],
		integrations: [
			spanStreamingIntegration(),
			reactRouterTracingIntegration(),
			browserProfilingIntegration(),
			replayIntegration({
				mask: ["[data-mask]"],
				unmask: ["[data-unmask]"],
				block: ["[data-block]"],
				unblock: ["[data-unblock]"],
				ignore: ["[data-ignore]"],
				maskAttributes: [
					"title",
					"placeholder",
					"aria-label",
					"alt",
					"href"
				]
			})
		]
	});

	const { native, vision } = device;

	getGlobalScope().setAttributes({
		native,
		vision
	});
}
