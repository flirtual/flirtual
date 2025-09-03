import { useEffect } from "react";
import { matchRoutes } from "react-router";
import type { To } from "react-router";

import { log } from "./log";

export async function preloadRoute(to: To) {
	log("preloadRoute(%s)", to);

	// @ts-expect-error: React Router internal.
	const matches = matchRoutes(globalThis.__reactRouterDataRouter.routes, to) || [];

	await Promise.all(matches.map(async ({ route }) => {
		// @ts-expect-error: React Router internal.
		const handle = route.handle || await route.lazy?.handle();
		if (!handle || typeof handle !== "object" || !handle.preload) return null;

		log("preloadRoute(%s): invoking %o", to, route.id);
		return handle.preload();
	}));
}

export function useOptimisticRoute(to: To) {
	useEffect(() => void preloadRoute(to), [to]);
}
