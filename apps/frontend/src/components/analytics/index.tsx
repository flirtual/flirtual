"use client";

import * as Sentry from "@sentry/nextjs";
import dynamic from "next/dynamic";
import Script from "next/script";
import { PostHogProvider } from "posthog-js/react";
import { type PropsWithChildren, useCallback, useEffect } from "react";

import { displayName } from "~/api/user";
import { cloudflareBeaconId, environment } from "~/const";
import { useDevice } from "~/hooks/use-device";
import { useLocation } from "~/hooks/use-location";
import { useSession } from "~/hooks/use-session";

import { posthog, usePostHog } from "./posthog";

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
		posthog.clear_opt_in_out_capturing();
		posthog.reset();
	}, [posthog]);

	useEffect(() => {
		if (!session) return reset();

		const { preferences, email, ...user } = session.user;
		if (!preferences?.privacy.analytics) return reset();

		posthog.identify(session.user.id, { name: displayName(user), email, });
		Sentry.setUser({ id: session.user.id, username: displayName(user) });
	}, [posthog, session, reset]);

	useEffect(() => {
		posthog.capture("$set", {
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
	return (
		<PostHogProvider client={posthog}>
			<Pageview />
			<Identity />
			{environment !== "development" && (
				<Script
					defer
					data-cf-beacon={JSON.stringify({ token: cloudflareBeaconId })}
					src="https://static.cloudflareinsights.com/beacon.min.js"
				/>
			)}
			{children}
		</PostHogProvider>
	);
}
