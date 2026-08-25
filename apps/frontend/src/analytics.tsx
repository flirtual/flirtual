import { PostHogProvider } from "@posthog/react";
import {
	AnalyticsExtensions,
	ExperimentsExtensions,
	FeatureFlagsExtensions
} from "posthog-js/dist/extension-bundles";
import { posthog } from "posthog-js/dist/module.slim.no-external";
import type { PropsWithChildren } from "react";
import { toKebabCase } from "remeda";

import {
	posthogHost,
	posthogKey,
	posthogUiHost
} from "~/const";

import type { Session } from "./api/auth";
import { log as _log } from "./log";
import {
	queryClient,
	sessionFetcher,
	sessionKey
} from "./query";

// eslint-disable-next-line react-refresh/only-export-components
export { posthog };

const log = _log.extend("analytics");

const loggedOutAnalytics = true;

function patchPosthogLogger() {
	if (!log.enabled) return;

	const posthogPrefix = "[PostHog.js]";
	const namespaces = new Map<string, typeof log>();

	for (const level of ["log", "info", "debug"] as const) {
		// eslint-disable-next-line no-console
		const original = console[level].bind(console);

		// eslint-disable-next-line no-console
		console[level] = (...arguments_: Array<unknown>) => {
			const [prefix, message, ...rest] = arguments_;
			if (typeof prefix !== "string" || !prefix.startsWith(posthogPrefix))
				return original(...arguments_);

			const namespace = toKebabCase(
				prefix.slice(posthogPrefix.length).trim().replace(/^\[(.*)\]$/, "$1")
			);
			let logger = namespaces.get(namespace);
			if (!logger) {
				logger = namespace ? log.extend(namespace) : log;
				namespaces.set(namespace, logger);
			}

			logger(message, ...rest);
		};
	}
}

// eslint-disable-next-line react-refresh/only-export-components
export async function setupAnalytics() {
	patchPosthogLogger();

	// Wait for session (and analytical preferences) to be available.
	await queryClient.prefetchQuery({ queryKey: sessionKey(), queryFn: sessionFetcher });
	await queryClient.ensureQueryData({ queryKey: sessionKey() });

	posthog.init(posthogKey, {
		disable_external_dependency_loading: true,
		__extensionClasses: {
			...AnalyticsExtensions,
			...FeatureFlagsExtensions,
			...ExperimentsExtensions
		},

		debug: log.enabled,

		defaults: "2026-01-30",

		api_host: posthogHost,
		ui_host: posthogUiHost,

		cookieless_mode: "always",
		person_profiles: "never",
		disable_persistence: true,
		persistence: "memory",

		internal_or_test_user_hostname: null,

		before_send: (event) => {
			if (!event) return event;

			const session = queryClient.getQueryData<Session | null>(sessionKey());
			const optIn = session?.user.preferences?.privacy.analytics ?? loggedOutAnalytics;

			if (!optIn) return null;
			return event;
		},
	});
}

export function AnalyticsProvider({ children }: PropsWithChildren) {
	return (
		// @ts-expect-error - @posthog/react does not support slim bundles, apparently.
		<PostHogProvider client={posthog}>
			{children}
		</PostHogProvider>
	);
}
