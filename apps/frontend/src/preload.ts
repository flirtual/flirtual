import { useEffect } from "react";
import { matchRoutes } from "react-router";
import type { To } from "react-router";

export async function preloadRoute(to: To) {
	// @ts-expect-error: React Router internal.
	const matches = matchRoutes(globalThis.__reactRouterDataRouter.routes, to) || [];

	await Promise.all(matches.map(async ({ route }) => {
		// @ts-expect-error: React Router internal.
		const handle = route.handle || await route.lazy?.handle();
		if (!handle || typeof handle !== "object" || !handle.preload) return null;

		return handle.preload();
	}));
}

export function useOptimisticRoute(to: To) {
	useEffect(() => void preloadRoute(to), [to]);
}
