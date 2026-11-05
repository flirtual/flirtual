import {
	browserProfilingIntegration,
	getGlobalScope,
	init,
	reactRouterTracingIntegration,
	replayIntegration,
	spanStreamingIntegration
} from "@sentry/react-router";
import { hashKey } from "@tanstack/react-query";

import type { Session } from "~/api/auth";
import {
	apiOrigin,
	development,
	preview,
	sentryDsn,
	sentryProfiles,
	sentryTraces,
	siteOrigin
} from "~/const";
import { device } from "~/hooks/use-device";
import { queryClient, sessionKey } from "~/query";

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

		dataCollection: {
			userInfo: false,
			cookies: false,
			httpHeaders: {
				request: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
				response: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] }
			},
			httpBodies: [],
			urlQueryParams: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
			genAI: { inputs: false, outputs: false },
			databaseQueryData: false,
			queues: false,
			graphQL: { document: false, variables: false }
		},

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

	const { native, vision, build, version } = device;

	const app = native ? { native, vision, build, version } : { native, vision };

	getGlobalScope().setAttributes(app);
	getGlobalScope().setTags(app);

	let userId: string | undefined;
	const identify = () => {
		const session = queryClient.getQueryData<Session | null>(sessionKey());
		if (session?.user.id === userId) return;

		userId = session?.user.id;
		const sudo = !!session?.sudoerId;

		getGlobalScope().setUser(userId ? { id: userId } : null);
		getGlobalScope().setAttributes({ sudo });
		getGlobalScope().setTags({ sudo });
	};

	identify();
	queryClient.getQueryCache().subscribe(({ query }) => {
		if (query.queryHash === hashKey(sessionKey())) identify();
	});
}
