export function getCurrentViewName(): string {
	return (document.querySelector("meta[name=current-view]") as HTMLMetaElement).content;
}

export function clamp(value: number, min: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}
