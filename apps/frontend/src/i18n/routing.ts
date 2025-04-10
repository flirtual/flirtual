import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
	locales: ["en", "ja"],
	defaultLocale: "en",
	localePrefix: "as-needed",
	alternateLinks: true
});

export const { defaultLocale, locales } = routing;
export type Locale = typeof locales[number];
