import i18n, { type ResourceKey } from "i18next";
import icu from "i18next-icu";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next, useTranslation } from "react-i18next";

export const locales = ["en", "ja"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale = "en";
export type DefaultLocale = typeof defaultLocale;

export type Resources = Awaited<ReturnType<typeof load>>;
export type Namespace = keyof Resources;

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: "default";
		resources: Resources;
	}
}

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

function flat1<T extends Record<string, Record<string, ResourceKey>>>(value: T) {
	return Object.values(value).reduce((previous, current) => {
		return { ...previous, ...current };
	}, {});
}

async function load(locale: Locale) {
	const [default_, attributes, uppy] = await Promise.all([
		// Types are not available when using a dynamic import, so we default to English for type safety.
		import(`../messages/${locale}.json`) as unknown as typeof import("../messages/en.json"),
		import(`../messages/attributes.${locale}.json`)
			.then(({ default: attributes }) => flat1(attributes)),
		(async () => {
			// https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
			switch (locale) {
				case "en": return (await import("@uppy/locales/lib/en_US.js")).default.strings;
				case "ja": return (await import("@uppy/locales/lib/ja_JP.js")).default.strings;
				default: return {};
			}
		})(),
	]);

	return {
		default: default_,
		attributes,
		uppy
	};
}

i18n
	.use(resourcesToBackend(load))
	.use(icu)
	.use(initReactI18next)
	.init({
		fallbackLng: defaultLocale,
		ns: ["default"],
		defaultNS: "default",
		supportedLngs: locales,

		interpolation: {
			escapeValue: false
		}
	});

export function useLocale(): Locale {
	const { i18n } = useTranslation();
	return i18n.language as Locale;
}

// @ts-expect-error: Not applicable.
export function useMessages<T extends Namespace = "default">(namespace: T = "default"): Resources[T] {
	const { i18n } = useTranslation();
	const locale = useLocale();

	return i18n.store.data[locale][namespace] as Resources[T];
}

export { i18n };
