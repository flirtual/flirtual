import { useDebugValue, useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, defaultValue: T) {
	const [value, setValue] = useState(defaultValue);

	useDebugValue(key);

	useEffect(() => {
		const localValue = localStorage.getItem(key);
		if (localValue) setValue(JSON.parse(localValue) as T);
	}, [key]);

	return [
		value as T,
		(newValue: T) => {
			localStorage.setItem(key, JSON.stringify(newValue));
			setValue(newValue);
		}
	] as const;
}
