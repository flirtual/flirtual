import { memo } from "react";
import type { FC } from "react";
import { preload } from "react-dom";

import { production } from "./const";
import type { Locale } from "./i18n";

// eslint-disable-next-line react-refresh/only-export-components
export const polyfillBaseUrl = new URL(`https://cdnjs.cloudflare.com/polyfill/v3/polyfill${production ? ".min" : ""}.js`);

function getPolyfillFeatures(locale: Locale): Array<string> {
	const test = locale === "cimode";

	return [
		"Intl",
		"Intl.Locale",
		"Intl.DateTimeFormat",
		!test && `Intl.DateTimeFormat.~locale.${locale}`,
		`Intl.NumberFormat`,
		!test && `Intl.NumberFormat.~locale.${locale}`,
		"Intl.PluralRules",
		!test && `Intl.PluralRules.~locale.${locale}`,
		"Intl.RelativeTimeFormat",
		!test && `Intl.RelativeTimeFormat.~locale.${locale}`,
		"Intl.ListFormat",
		!test && `Intl.ListFormat.~locale.${locale}`
	].filter(Boolean);
}

// eslint-disable-next-line react-refresh/only-export-components
export function getPolyfillUrl(locale: Locale) {
	return new URL(`${polyfillBaseUrl}?features=${getPolyfillFeatures(locale).join(",")}`);
}

export const PolyfillScript: FC<{ locale: Locale }> = memo(({ locale }) => {
	const { href } = getPolyfillUrl(locale);

	preload(href, { as: "script" });
	return <script src={href} />;
});
