import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
	locales: ["en", "ja"],
	defaultLocale: "en",
	localePrefix: "as-needed",
	alternateLinks: true
});

export const { defaultLocale, locales } = routing;

declare module "next-intl" {
	interface AppConfig {
		Locale: typeof locales[number];
	}
}
