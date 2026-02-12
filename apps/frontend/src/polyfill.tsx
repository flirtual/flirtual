import { memo } from "react";
import type { FC } from "react";
import { preload } from "react-dom";

import { production } from "./const";
import type { Locale } from "./i18n";

import "@shgysk8zer0/polyfills/cookieStore.js";

// eslint-disable-next-line react-refresh/only-export-components
export const polyfillBaseUrl = new URL(`https://cdnjs.cloudflare.com/polyfill/v3/polyfill${production ? ".min" : ""}.js`);

function getPolyfillFeatures(locale: Locale): Array<string> {
	return [
		"Array.prototype.at",
		"Array.prototype.toReversed",
		"HTMLFormElement.prototype.requestSubmit",
		"Intl",
		"Intl.DateTimeFormat",
		"Intl.ListFormat",
		"Intl.Locale",
		"Intl.PluralRules",
		"Intl.RelativeTimeFormat",
		`Intl.DateTimeFormat.~locale.${locale}`,
		`Intl.ListFormat.~locale.${locale}`,
		`Intl.NumberFormat.~locale.${locale}`,
		`Intl.NumberFormat`,
		`Intl.PluralRules.~locale.${locale}`,
		`Intl.RelativeTimeFormat.~locale.${locale}`,
	].filter(Boolean);
}

export const PolyfillScript: FC<{ locale: Locale }> = memo(({ locale }) => {
	const { href } = new URL(`${polyfillBaseUrl}?version=4.8.0&features=${getPolyfillFeatures(locale).join(",")}`);

	preload(href, { as: "script", fetchPriority: "high" });
	return <script src={href} />;
});
