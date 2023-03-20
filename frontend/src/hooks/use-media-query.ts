import { useDebugValue, useCallback, useSyncExternalStore, useMemo } from "react";

export function useMediaQuery(query: string) {
	const queryList = useMemo(() => matchMedia(query), [query]);
	useDebugValue(queryList.media);

	const subscribe = useCallback(
		(callback: (ev: MediaQueryListEvent) => void) => {
			queryList.addEventListener("change", callback);
			return () => queryList.removeEventListener("change", callback);
		},
		[queryList]
	);

	const getSnapshot = useCallback(() => queryList.matches, [queryList]);

	return useSyncExternalStore(subscribe, getSnapshot);
}
