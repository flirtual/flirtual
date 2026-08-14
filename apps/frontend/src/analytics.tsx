import { PostHogProvider } from "@posthog/react";
import { posthog } from "posthog-js";
import type { PropsWithChildren } from "react";

import { posthogHost, posthogKey, posthogUiHost } from "~/const";

import type { Session } from "./api/auth";
import { log } from "./log";
import { queryClient, sessionKey } from "./query";

posthog.init(posthogKey, {
	debug: log.enabled,
	defaults: "2026-01-30",

	api_host: posthogHost,
	ui_host: posthogUiHost,

	cookieless_mode: "always",
	person_profiles: "never",

	disable_compression: true,

	before_send: (event) => {
		if (!event) return event;

		const session = queryClient.getQueryData<Session | null>(sessionKey());
		const optIn = session?.user.preferences?.privacy.analytics ?? false;

		if (!optIn) return null;
		return event;
	},
});

export function AnalyticsProvider({ children }: PropsWithChildren) {
	return (
		<PostHogProvider client={posthog}>
			{children}
		</PostHogProvider>
	);
}
