import posthog from "posthog-js";
import { usePostHog } from "posthog-js/react";

import { posthogHost, posthogKey } from "~/const";

if (typeof window !== "undefined") {
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
}

export { posthog, usePostHog };
