"use client";

import { useCallback, useDebugValue, useEffect, useState } from "react";

import { useGlobalEventListener } from "./use-event-listener";
import { useHydrated } from "./use-hydrated";

export function useLocalStorage<T>(key: string, defaultValue: T) {
	const [value, setValue] = useState(defaultValue);
	const hydrated = useHydrated();

	useDebugValue(key);

	const set = useCallback(
		(newValue: T) => {
			localStorage.setItem(key, JSON.stringify(newValue));
			setValue(newValue);
		},
		[key]
	);

	useGlobalEventListener("window", "storage", (event) => {
		if (event.key !== key) return;
		setValue(event.newValue ? (JSON.parse(event.newValue) as T) : defaultValue);
	});

	useEffect(() => {
		const localValue = localStorage.getItem(key);
		if (localValue) setValue(JSON.parse(localValue) as T);
	}, [key]);

	return [hydrated ? value : null, set] as const;
}
