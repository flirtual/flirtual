export function clamp(value: number, min: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function omit<T extends {}, K extends keyof T>(value: T, keys: Array<K>): Omit<T, K> {
	return Object.fromEntries(
		Object.entries(value).filter(([key]) => !keys.includes(key as K))
	) as Omit<T, K>;
}

export function getCSRFToken() {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return document.querySelector(`meta[name="csrf-token"]`)!.getAttribute("content");
}
