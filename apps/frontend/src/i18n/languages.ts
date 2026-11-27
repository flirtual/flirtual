import localeData from "@flirtual/data/locales";
import acceptLanguage from "accept-language";
import { resolvePath } from "react-router";
import type { Path, To } from "react-router";

export type AnyLocale = keyof typeof localeData;
export const allLocales = Object.keys(localeData) as Array<AnyLocale>;

// `intl` names the locale for `Intl` where ours differs: our `pt` is European Portuguese, but CLDR
// reads `pt` as Brazilian.
export function intlLocale(locale: string) {
	const entry = localeData[locale as AnyLocale];
	return entry && "intl" in entry ? entry.intl : locale;
}

export type Locale = AnyLocale;
export const locales = allLocales.filter((locale) => localeData[locale].enabled);

export const defaultLocale: Locale = allLocales.find((locale) => {
	const entry = localeData[locale];
	return "default" in entry && entry.default;
})!;

export function isLocale(locale: string): locale is Locale {
	return locales.includes(locale as Locale);
}

export const localePathnameRegex = new RegExp(`^\/((${locales.join("|")})?(\/|$))?`);

export const localeNames = Object.fromEntries(
	allLocales.map((locale) => [locale, localeData[locale].name])
) as Record<Locale, string>;

export function getLocale(to: To, relativeTo: string = location.pathname): Locale | null {
	const { pathname } = resolvePath(to, relativeTo);
	const match = pathname.match(localePathnameRegex);
	if (!match) return null;

	const [, , locale] = match as [never, never, Locale | undefined];
	return locale && locales.includes(locale) ? locale : null;
}

export function replaceLanguage(to: To, locale: Locale | null, relativeTo: string = location.pathname): Path {
	let { pathname, ...path } = resolvePath(to, relativeTo);

	pathname = pathname.replace(localePathnameRegex, locale ? `/${locale}/` : "/");
	if (pathname.endsWith("/") && pathname !== "/") pathname = pathname.slice(0, -1);

	return { ...path, pathname };
}

acceptLanguage.languages([...locales]);

export function getRecommendedLocale(acceptLanguageHeader: string | null): Locale | null {
	const language = acceptLanguage.get(acceptLanguageHeader) as Locale | null;
	if (!language || !locales.includes(language)) return null;

	return language;
}
