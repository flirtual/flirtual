"use client";

import { setTag, setUser } from "@sentry/nextjs";
import dynamic from "next/dynamic";
import Script from "next/script";
import posthog from "posthog-js";
import { PostHogProvider, usePostHog } from "posthog-js/react";
import { type PropsWithChildren, Suspense, useCallback, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";

import {
	cloudflareBeaconId,
	environment,
	posthogEnabled,
	posthogHost,
	posthogKey
} from "~/const";
import { useDevice } from "~/hooks/use-device";
import { useLocation } from "~/hooks/use-location";
import { useOptionalSession } from "~/hooks/use-session";

const Pageview = dynamic(() => Promise.resolve(() => {
	const location = useLocation();
	const posthog = usePostHog();

	useEffect(() => {
		if (!location || !posthog) return;
		posthog.capture("$pageview", { $current_url: location.href, });
	}, [location, posthog]);

	return null;
}), { ssr: false });

function Identity() {
	const session = useOptionalSession();

	const userId = session?.user.id || null;
	const optIn = session?.user.preferences?.privacy.analytics || true;

	const { native, vision } = useDevice();
	const posthog = usePostHog();

	const posthogOptIn = session?.user.tags?.includes("admin")
		// || session?.user.tags?.includes("moderator")
		|| session?.user.tags?.includes("debugger")
		|| false;

	const reset = useCallback(() => {
		setUser(null);

		if (posthog) {
			posthog.clear_opt_in_out_capturing();
			posthog.reset();
		}
	}, [posthog]);

	useEffect(() => {
		if (!userId || !optIn) return reset();
		if (posthogOptIn) posthog?.opt_in_capturing();

		posthog?.identify(userId);
		setUser({ id: userId });
	}, [posthog, userId, optIn, posthogOptIn, reset]);

	useEffect(() => {
		if (posthog) posthog.capture("$set", {
			$set: {
				native,
				vision
			}
		});

		setTag("native", native ? "yes" : "no");
		setTag("vision", vision ? "yes" : "no");
	}, [posthog, native, vision]);

	return null;
}

export function AnalyticsProvider({ children }: PropsWithChildren) {
	useEffect(() => {
		if (!posthogEnabled) return;

		posthog.init(posthogKey, {
			api_host: posthogHost,
			person_profiles: "identified_only",
			opt_out_capturing_by_default: true,
			capture_pageview: false,
			capture_pageleave: true,
			session_recording: {
				maskAllInputs: true,
				maskTextSelector: "[data-mask]",
				blockSelector: "[data-block]",
			}
		});
	}, []);

	if (posthogEnabled)
		children = <PostHogProvider client={posthog}>{children}</PostHogProvider>;

	return (
		<>
			<ErrorBoundary fallback={null}>
				<Suspense>
					<Pageview />
					<Identity />
				</Suspense>
			</ErrorBoundary>
			{environment !== "development" && (
				<Script
					defer
					data-cf-beacon={JSON.stringify({ token: cloudflareBeaconId })}
					src="https://static.cloudflareinsights.com/beacon.min.js"
				/>
			)}
			{children}
		</>
	);
}
