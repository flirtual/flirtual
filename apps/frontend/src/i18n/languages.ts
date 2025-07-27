import acceptLanguage from "accept-language";
import { resolvePath } from "react-router";
import type { Path, To } from "react-router";

export const locales = ["en", "ja"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale = "en";
export type DefaultLocale = typeof defaultLocale;

// eslint-disable-next-line regexp/no-optional-assertion
export const localePathnameRegex = new RegExp(`^\/(${locales.join("|")})?(\/|$)?`);

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

export function getLocale(to: To, relativeTo: string = window.location.pathname): Locale | null {
	const { pathname } = resolvePath(to, relativeTo);
	const match = pathname.match(localePathnameRegex);
	if (!match) return null;

	const [, locale] = match as [never, Locale | undefined];
	return locale && locales.includes(locale) ? locale : null;
}

export function replaceLanguage(to: To, locale: Locale | null, relativeTo: string = window.location.pathname): Path {
	let { pathname, ...path } = resolvePath(to, relativeTo);

	pathname = pathname.replace(localePathnameRegex, locale ? `/${locale}/` : "/");
	if (pathname.endsWith("/")) pathname = pathname.slice(0, -1);

	return { ...path, pathname };
}

acceptLanguage.languages([...locales]);

export function getRecommendedLocale(acceptLanguageHeader: string | null): Locale | null {
	const language = acceptLanguage.get(acceptLanguageHeader) as Locale | null;
	if (!language || !locales.includes(language)) return null;

	return language;
}
