export function clamp(value: number, min: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}

export function getCSRFToken() {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return document.querySelector(`meta[name="csrf-token"]`)!.getAttribute("content");
}
