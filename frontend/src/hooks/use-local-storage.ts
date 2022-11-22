import { useState } from "react";

export function useLocalStorage<T extends string>(key: string, initial: T) {
	const [value, setValue] = useState(
		(typeof localStorage !== "undefined" && localStorage.getItem(key)) ?? initial
	);

	return [
		value,
		(newValue: T) => {
			localStorage.setItem(key, newValue);
			setValue(newValue);
		}
	];
}
