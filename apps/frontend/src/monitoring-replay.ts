import { replayIntegration } from "@sentry/react-router";

export const replay = replayIntegration({
	mask: ["[data-mask]"],
	unmask: ["[data-unmask]"],
	block: ["[data-block]"],
	unblock: ["[data-unblock]"],
	ignore: ["[data-ignore]"],
	maskAttributes: [
		"title",
		"placeholder",
		"aria-label",
		"alt",
		"href"
	]
});
