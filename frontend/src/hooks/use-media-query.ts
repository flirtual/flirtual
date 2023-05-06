"use client";

import { useDebugValue, useState, useEffect } from "react";

export function useMediaQuery(media: string, defaultValue: boolean = false) {
	const [value, setValue] = useState(defaultValue);
	useMediaQueryEvent(media, setValue);

	return value;
}

export function useMediaQueryEvent(media: string, callback: (matches: boolean) => void) {
	useDebugValue(media);

	useEffect(() => {
		const queryList = matchMedia(media);
		callback(queryList.matches);

		function onChange(ev: MediaQueryListEvent) {
			callback(ev.matches);
		}

		queryList.addEventListener("change", onChange);
		return () => queryList.removeEventListener("change", onChange);
	}, [media, callback]);
}
