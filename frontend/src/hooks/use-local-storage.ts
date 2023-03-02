import { useEffect, useState } from "react";

export function useLocalStorage<T extends string>(key: string, initial: T): [T, React.Dispatch<T>] {
	const [value, setValue] = useState(initial);

	useEffect(() => {
		const localValue = localStorage.getItem(key) as T | undefined;
		if (localValue) setValue(localValue);
	}, [key]);

	return [
		value as T,
		(newValue: T) => {
			localStorage.setItem(key, newValue);
			setValue(newValue);
		}
	];
}
