import { PostHogProvider } from "@posthog/react";
import { useQuery } from "@tanstack/react-query";
import { posthog } from "posthog-js";
import { Suspense, use } from "react";
import type { PropsWithChildren } from "react";

import { commitId, posthogHost, posthogKey, server } from "~/const";

import type { Session } from "./api/auth";
import { logOnce } from "./hooks/use-log";
import { log } from "./log";
import { queryClient, sessionFetcher, sessionKey } from "./query";
import { absoluteUrl, urls } from "./urls";

let ready = false;

function initializeAnalytics() {
	if (ready) return;

	posthog.init(posthogKey, {
		debug: log.enabled,

		api_host: posthogHost,

		defaults: "2025-11-30",
		cookieless_mode: "always",

		// https://github.com/PostHog/posthog-js/issues/2828
		// disable_external_dependency_loading: true,
		external_scripts_inject_target: "head",

		opt_out_capturing_by_default: true,
		opt_out_capturing_persistence_type: "localStorage",

		before_send: (event) => {
			if (!event) return event;

			const session = queryClient.getQueryData<Session | null>(sessionKey());
			const optIn = session?.user.preferences?.privacy.analytics ?? true;

			if (!optIn)
				return null;

			event.properties.$version = commitId;

			return event;
		},
	});

	logOnce(`Anonymous analytics enabled, you can opt out at ${absoluteUrl(urls.settings.privacy)}.`);
	ready = true;
}

function AnalyticsProvider({ children }: PropsWithChildren) {
	if (server) return children;

	// eslint-disable-next-line react-hooks/rules-of-hooks
	const { promise } = useQuery({
		queryKey: sessionKey(),
		queryFn: sessionFetcher
	});

	const session = use(promise);

	const optIn = session?.user.preferences?.privacy.analytics ?? true;
	if (optIn) initializeAnalytics();

	return (
		<PostHogProvider client={posthog}>
			{children}
		</PostHogProvider>
	);
}

function AnalyticsProviderWithFallback({ children }: PropsWithChildren) {
	return (
		<Suspense fallback={children}>
			<AnalyticsProvider>{children}</AnalyticsProvider>
		</Suspense>
	);
}

export { AnalyticsProviderWithFallback as AnalyticsProvider };
