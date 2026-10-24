// Keep import-free: routes.ts loads this where virtual modules don't resolve.

export const homieMode = import.meta.env.VITE_FEATURE_HOMIE_MODE !== "0";
export const personality = import.meta.env.VITE_FEATURE_PERSONALITY !== "0";
export const vrTags = import.meta.env.VITE_FEATURE_VR_TAGS !== "0";
export const vrchat = import.meta.env.VITE_FEATURE_VRCHAT !== "0";

export const connectionProviders = (
	import.meta.env.VITE_FEATURE_CONNECTIONS as string || "discord,vrchat,google,apple,meta"
).split(",").map((type) => type.trim()).filter(Boolean);

export function connectionProvider(type: string) {
	return connectionProviders.includes(type) && (type !== "vrchat" || vrchat);
}
