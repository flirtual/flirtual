import { shouldPolyfill as needsDateTimeFormat } from "@formatjs/intl-datetimeformat/should-polyfill.js";
import { shouldPolyfill as needsDisplayNames } from "@formatjs/intl-displaynames/should-polyfill.js";
import { shouldPolyfill as needsListFormat } from "@formatjs/intl-listformat/should-polyfill.js";
import { shouldPolyfill as needsLocale } from "@formatjs/intl-locale/should-polyfill.js";
import { shouldPolyfill as needsNumberFormat } from "@formatjs/intl-numberformat/should-polyfill.js";
import { shouldPolyfill as needsPluralRules } from "@formatjs/intl-pluralrules/should-polyfill.js";
import { shouldPolyfill as needsRelativeTimeFormat } from "@formatjs/intl-relativetimeformat/should-polyfill.js";

import type { Locale } from "./i18n/languages";

export const targets = [
	"chrome106",
	"edge106",
	"firefox104",
	"safari15"
];

const {
	PluralRules,
	DateTimeFormat,
	DisplayNames,
	ListFormat,
	NumberFormat,
	RelativeTimeFormat
} = {
	PluralRules: {
		en: () => import("@formatjs/intl-pluralrules/locale-data/en.js")
	},
	RelativeTimeFormat: {
		en: () => import("@formatjs/intl-relativetimeformat/locale-data/en.js")
	},
	DisplayNames: {
		en: () => import("@formatjs/intl-displaynames/locale-data/en.js")
	},
	ListFormat: {
		en: () => import("@formatjs/intl-listformat/locale-data/en.js")
	},
	NumberFormat: {
		en: () => import("@formatjs/intl-numberformat/locale-data/en.js")
	},
	DateTimeFormat: {
		en: () => import("@formatjs/intl-datetimeformat/locale-data/en.js")
	},
} satisfies Record<string, Record<Locale, () => Promise<unknown>>>;

export async function polyfillForLanguage(locale: Locale) {
	await Promise.all([
		needsLocale() && import("@formatjs/intl-locale/polyfill-force.js"),
		needsPluralRules(locale) && import("@formatjs/intl-pluralrules/polyfill-force.js")
			.then(() => PluralRules[locale]()),
		needsRelativeTimeFormat(locale) && import("@formatjs/intl-relativetimeformat/polyfill-force.js")
			.then(() => RelativeTimeFormat[locale]()),
		needsDisplayNames(locale) && import("@formatjs/intl-displaynames/polyfill-force.js")
			.then(() => DisplayNames[locale]()),
		needsListFormat(locale) && import("@formatjs/intl-listformat/polyfill-force.js")
			.then(() => ListFormat[locale]()),
		needsNumberFormat(locale) && import("@formatjs/intl-numberformat/polyfill-force.js")
			.then(() => NumberFormat[locale]()),
		needsDateTimeFormat(locale) && import("@formatjs/intl-datetimeformat/polyfill-force.js")
			.then(() => Promise.all([
				import("@formatjs/intl-datetimeformat/add-all-tz.js"),
				DateTimeFormat[locale]()
			])),
	].filter(Boolean));
}
