import { memo } from "react";
import type { FC } from "react";
import { preload } from "react-dom";

import { production } from "./const";
import type { Locale } from "./i18n";

// eslint-disable-next-line react-refresh/only-export-components
export const polyfillBaseUrl = new URL(`https://cdnjs.cloudflare.com/polyfill/v3/polyfill${production ? ".min" : ""}.js`);

function getPolyfillFeatures(locale: Locale): Array<string> {
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
	].filter(Boolean);
}

export const PolyfillScript: FC<{ locale: Locale }> = memo(({ locale }) => {
	const { href } = new URL(`${polyfillBaseUrl}?features=${getPolyfillFeatures(locale).join(",")}`);

	preload(href, { as: "script", fetchPriority: "high" });
	return <script src={href} />;
});
