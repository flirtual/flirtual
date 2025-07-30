import { production } from "./const";
import type { Locale } from "./i18n";

export const polyfillBaseUrl = new URL(`https://cdnjs.cloudflare.com/polyfill/v3/polyfill${production ? ".min" : ""}.js`);

function getPolyfillFeatures(locale: string): Array<string> {
	return [
		"Intl",
		"Intl.Locale",
		"Intl.DateTimeFormat",
		`Intl.DateTimeFormat.~locale.${locale}`,
		`Intl.NumberFormat`,
		`Intl.NumberFormat.~locale.${locale}`,
		"Intl.PluralRules",
		`Intl.PluralRules.~locale.${locale}`,
		"Intl.RelativeTimeFormat",
		`Intl.RelativeTimeFormat.~locale.${locale}`,
		"Intl.ListFormat",
		`Intl.ListFormat.~locale.${locale}`
	];
}

export function getPolyfillUrl(locale: Locale) {
	return `${polyfillBaseUrl}?features=${getPolyfillFeatures(locale).join(",")}`;
}
