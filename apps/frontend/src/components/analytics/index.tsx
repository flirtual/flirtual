"use client";

import * as Sentry from "@sentry/nextjs";
import dynamic from "next/dynamic";
import Script from "next/script";
import posthog from "posthog-js";
import { PostHogProvider, usePostHog } from "posthog-js/react";
import { type PropsWithChildren, useCallback, useEffect } from "react";

import { displayName } from "~/api/user";
import { cloudflareBeaconId, environment, posthogHost, posthogKey } from "~/const";
import { useDevice } from "~/hooks/use-device";
import { useLocation } from "~/hooks/use-location";
import { useCurrentUser, useSession } from "~/hooks/use-session";

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
	const [session] = useSession();
	const { native, vision } = useDevice();
	const posthog = usePostHog();

	const reset = useCallback(() => {
		Sentry.setUser(null);

		if (posthog) {
			posthog.clear_opt_in_out_capturing();
			posthog.reset();
		}
	}, [posthog]);

	useEffect(() => {
		if (!session) return reset();

		const { preferences, email, ...user } = session.user;
		if (!preferences?.privacy.analytics) return reset();

		if (posthog) posthog.identify(session.user.id, { name: displayName(user), email, });
		Sentry.setUser({ id: session.user.id, username: displayName(user) });
	}, [posthog, session, reset]);

	useEffect(() => {
		if (posthog) posthog.capture("$set", {
			$set: {
				native,
				vision
			}
		});

		Sentry.setTag("native", native ? "yes" : "no");
		Sentry.setTag("vision", vision ? "yes" : "no");
	}, [posthog, native, vision]);

	return null;
}

export function AnalyticsProvider({ children }: PropsWithChildren) {
	const current = useCurrentUser();
	const posthogOptIn = current?.tags?.includes("admin")
		|| current?.tags?.includes("moderator")
		|| current?.tags?.includes("debugger")
		// || current?.tags?.includes("beta_tester")
		|| false;

	useEffect(() => {
		if (!posthogOptIn) return;

		posthog.init(posthogKey, {
			api_host: posthogHost,
			person_profiles: "identified_only",
			capture_pageview: false,
			capture_pageleave: true,
			session_recording: {
				maskAllInputs: true,
				maskTextSelector: "[data-mask]",
				blockSelector: "[data-block]",
			}
		});
	}, [posthogOptIn]);

	if (posthogOptIn)
		children = <PostHogProvider client={posthog}>{children}</PostHogProvider>;

	return (
		<>
			<Pageview />
			<Identity />
			{environment !== "development" && (!current || current.preferences?.privacy.analytics) && (
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
