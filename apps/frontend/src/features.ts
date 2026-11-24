// Keep import-free: routes.ts loads this where virtual modules don't resolve.

export const homieMode = import.meta.env.VITE_FEATURE_HOMIE_MODE !== "0";
export const personality = import.meta.env.VITE_FEATURE_PERSONALITY !== "0";
export const vrTags = import.meta.env.VITE_FEATURE_VR_TAGS !== "0";
export const vrchat = import.meta.env.VITE_FEATURE_VRCHAT !== "0";
export const events = import.meta.env.VITE_FEATURE_EVENTS !== "0";
export const news = import.meta.env.VITE_FEATURE_NEWS !== "0";
export const press = import.meta.env.VITE_FEATURE_PRESS !== "0";
export const apk = import.meta.env.VITE_FEATURE_APK !== "0";
export const landing = import.meta.env.VITE_FEATURE_LANDING !== "0";
export const playlists = import.meta.env.VITE_FEATURE_PLAYLISTS !== "0";
export const timezones = import.meta.env.VITE_FEATURE_TIMEZONES !== "0";
export const advancedFilters = import.meta.env.VITE_FEATURE_ADVANCED_FILTERS !== "0";

export const connectionProviders = (
	import.meta.env.VITE_FEATURE_CONNECTIONS as string || "discord,vrchat,google,apple,meta"
).split(",").map((type) => type.trim()).filter(Boolean);

export const fun = (
	import.meta.env.VITE_FEATURE_FUN as string | undefined ?? "snowfall,assistant,ranked"
).split(",").map((name) => name.trim()).filter(Boolean);

export function connectionProvider(type: string) {
	return connectionProviders.includes(type) && (type !== "vrchat" || vrchat);
}
