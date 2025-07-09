import type { Locale } from "next-intl";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
	locales: ["en", "ja"],
	defaultLocale: "en",
	localePrefix: "as-needed",
	alternateLinks: true
});

export const {
	defaultLocale,
	locales
} = routing;

export const localePathnameRegex = new RegExp(`^/(${locales.join("|")})`);

export const localeNames: Record<Locale, string> = {
	en: "English",
	// de: "Deutsch",
	// es: "Español",
	// fr: "Français",
	ja: "日本語"// ,
	// ko: "한국어",
	// nl: "Nederlands",
	// pt: "Português",
	// "pt-BR": "Português (Brasil)",
	// ru: "Русский",
	// sv: "Svenska"
};

export function guessLocale() {
	const [, maybeLocale] = location.pathname.split("/");

	return maybeLocale && locales.includes(maybeLocale)
		? maybeLocale as Locale
		: defaultLocale;
}

declare module "next-intl" {
	interface AppConfig {
		Locale: typeof locales[number];
	}
}
