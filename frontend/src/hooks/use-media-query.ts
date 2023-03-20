"use client";

import { useDebugValue, useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(media: string) {
	useDebugValue(media);

	const subscribe = useCallback(
		(callback: (ev: MediaQueryListEvent) => void) => {
			const queryList = matchMedia(media);

			queryList.addEventListener("change", callback);
			return () => queryList.removeEventListener("change", callback);
		},
		[media]
	);

	const getSnapshot = useCallback(() => matchMedia(media).matches, [media]);
	const getServerSnapshot = useCallback(() => false, []);

	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
