"use client";

import { useDebugValue, useEffect, useState } from "react";

export function useMediaQuery(media: string, defaultValue: boolean = false) {
	const [value, setValue] = useState(defaultValue);
	useMediaQueryEvent(media, setValue);

	return value;
}

export function useMediaQueryEvent(
	media: string,
	callback: (matches: boolean) => void
) {
	useDebugValue(media);

	useEffect(() => {
		const queryList = matchMedia(media);
		callback(queryList.matches);

		function onChange(event: MediaQueryListEvent) {
			callback(event.matches);
		}

		queryList.addEventListener("change", onChange);
		return () => queryList.removeEventListener("change", onChange);
	}, [media, callback]);
}
