"use client";

import Script from "next/script";
import type { PropsWithChildren } from "react";

import { cloudflareBeaconId } from "~/const";
import { useSession } from "~/hooks/use-session";

import { PosthogProvider } from "./posthog";

export function AnalyticsProvider({ children }: PropsWithChildren) {
	// if (!session?.user.preferences?.privacy.analytics) return children;

	return (
		<PosthogProvider>
			<Script
				defer
				data-cf-beacon={JSON.stringify({ token: cloudflareBeaconId })}
				src="https://static.cloudflareinsights.com/beacon.min.js"
			/>
			{children}
		</PosthogProvider>
	);
}
