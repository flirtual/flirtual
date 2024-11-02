import dynamic from "next/dynamic";
import posthog from "posthog-js";
import { PostHogProvider, usePostHog } from "posthog-js/react";
import { type FC, type PropsWithChildren, useEffect } from "react";

import { posthogHost, posthogKey } from "~/const";
import { useLocation } from "~/hooks/use-location";
import { useSession } from "~/hooks/use-session";

const Pageview = dynamic(() => Promise.resolve(() => {
	const location = useLocation();
	const posthog = usePostHog();

	useEffect(() => {
		if (!location || !posthog) return;
		posthog.capture("$pageview", { $current_url: location.href, });
	}, [location, posthog]);

	return null;
}), { ssr: false });

export const PosthogProvider: FC<PropsWithChildren> = ({ children }) => {
	const [session] = useSession();

	useEffect(() => {
		posthog.init(posthogKey, {
			api_host: posthogHost,
			person_profiles: "identified_only",
			capture_pageview: false,
			session_recording: {
				maskAllInputs: true,
				maskTextSelector: "[data-mask]",
				blockSelector: "[data-block]",
			}
		});
	}, []);

	useEffect(() => {
		if (session) {
			if (session.user.preferences?.privacy.analytics)
				posthog.identify(session.user.id);

			return;
		}

		posthog.reset();
	}, [session]);

	return (
		<PostHogProvider client={posthog}>
			<Pageview />
			{children}
		</PostHogProvider>
	);
};

// eslint-disable-next-line react-refresh/only-export-components
export { posthog };
