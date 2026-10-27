import { shouldPolyfill as needsDateTimeFormat } from "@formatjs/intl-datetimeformat/should-polyfill.js";
import { shouldPolyfill as needsDisplayNames } from "@formatjs/intl-displaynames/should-polyfill.js";
import { shouldPolyfill as needsListFormat } from "@formatjs/intl-listformat/should-polyfill.js";
import { shouldPolyfill as needsLocale } from "@formatjs/intl-locale/should-polyfill.js";
import { shouldPolyfill as needsNumberFormat } from "@formatjs/intl-numberformat/should-polyfill.js";
import { shouldPolyfill as needsPluralRules } from "@formatjs/intl-pluralrules/should-polyfill.js";
import { shouldPolyfill as needsRelativeTimeFormat } from "@formatjs/intl-relativetimeformat/should-polyfill.js";

import { intlLocale } from "./i18n/languages.ts";
import type { AnyLocale } from "./i18n/languages.ts";

// Vite can't template-import bare package paths, so glob them; `exhaustive` lets it into node_modules.
const localeData = import.meta.glob(
	"/node_modules/@formatjs/intl-{pluralrules,relativetimeformat,displaynames,listformat,numberformat,datetimeformat}/locale-data/{en,de,es,fr,ja,ko,nl,pt,pt-PT,ru,sv}.js",
	{ exhaustive: true }
);

function loadLocaleData(api: string, locale: string) {
	// formatjs files Brazilian Portuguese as `pt`.
	const file = locale === "pt-BR" ? "pt" : locale;
	return localeData[`/node_modules/@formatjs/intl-${api}/locale-data/${file}.js`]!();
}

export async function polyfillForLanguage(appLocale: AnyLocale) {
	const locale = intlLocale(appLocale);

	await Promise.all([
		needsLocale() && import("@formatjs/intl-locale/polyfill-force.js"),
		needsPluralRules(locale) && import("@formatjs/intl-pluralrules/polyfill-force.js")
			.then(() => loadLocaleData("pluralrules", locale)),
		needsRelativeTimeFormat(locale) && import("@formatjs/intl-relativetimeformat/polyfill-force.js")
			.then(() => loadLocaleData("relativetimeformat", locale)),
		needsDisplayNames(locale) && import("@formatjs/intl-displaynames/polyfill-force.js")
			.then(() => loadLocaleData("displaynames", locale)),
		needsListFormat(locale) && import("@formatjs/intl-listformat/polyfill-force.js")
			.then(() => loadLocaleData("listformat", locale)),
		needsNumberFormat(locale) && import("@formatjs/intl-numberformat/polyfill-force.js")
			.then(() => loadLocaleData("numberformat", locale)),
		needsDateTimeFormat(locale) && import("@formatjs/intl-datetimeformat/polyfill-force.js")
			.then(() => Promise.all([
				import("@formatjs/intl-datetimeformat/add-all-tz.js"),
				loadLocaleData("datetimeformat", locale)
			])),
	].filter(Boolean));
}
