import { useState } from "react";

export function useLocalStorage<T extends string>(key: string, initial: T): [T, React.Dispatch<T>] {
	const [value, setValue] = useState(
		((typeof localStorage !== "undefined" && localStorage.getItem(key)) ?? initial) as string
	);

	return [
		value as T,
		(newValue: T) => {
			localStorage.setItem(key, newValue);
			setValue(newValue);
		}
	];
}
