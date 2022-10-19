export function getCurrentViewName(): string {
	return (document.querySelector("meta[name=current-view]") as HTMLMetaElement).content;
}
