export function loader() {
	return JSON.parse(import.meta.env.VITE_ASSETLINKS_JSON || "[]");
}
