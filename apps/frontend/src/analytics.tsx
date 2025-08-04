import { setTag, setUser } from "@sentry/react";
import { Suspense } from "react";
import type { PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";

import {
	client,
	cloudflareBeaconId,
	production
} from "~/const";
import { device } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";

function Identity() {
	const session = useOptionalSession();

	const userId = session?.user.id || null;
	const optIn = session?.user.preferences?.privacy.analytics || true;

	if (client) {
		setTag("native", device.native ? "yes" : "no");
		setTag("vision", device.vision ? "yes" : "no");

		setUser((userId && optIn) ? { id: userId } : null);
	}

	return null;
}

export function AnalyticsProvider({ children }: PropsWithChildren) {
	return (
		<>
			<Suspense>
				<ErrorBoundary fallbackRender={() => null}>
					{/* <Pageview /> */}
					<Identity />
				</ErrorBoundary>
			</Suspense>
			{production && cloudflareBeaconId && (
				<script
					async
					defer
					data-cf-beacon={JSON.stringify({ token: cloudflareBeaconId })}
					src="https://static.cloudflareinsights.com/beacon.min.js"
				/>
			)}
			{children}
		</>
	);
}
