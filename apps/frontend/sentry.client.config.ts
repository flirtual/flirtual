import {
	feedbackIntegration,
	init,
	replayIntegration
} from "@sentry/nextjs";

import {
	apiUrl,
	siteOrigin
} from "~/const";
import { sentryConfig } from "~/sentry";

init({
	...sentryConfig,
	integrations: [
		replayIntegration({
			blockAllMedia: false,
			maskAllText: false,
			maskAllInputs: true,
			mask: ["[data-mask]"],
			block: ["[data-block]"],
			networkDetailAllowUrls: [
				window.location.origin,
				new URL(siteOrigin).origin,
				new URL(apiUrl).origin
			]
		}),
		feedbackIntegration({
			autoInject: false
		})
	]
});
