import englishUppyMessages from "@uppy/locales/lib/en_US.js";
import japaneseUppyMessages from "@uppy/locales/lib/ja_JP.js";
import i18n, { type ResourceKey } from "i18next";
import icu from "i18next-icu";
import { initReactI18next, useTranslation } from "react-i18next";

import englishAttributeMessages from "~/../messages/attributes.en.json";
import japaneseAttributeMessages from "~/../messages/attributes.ja.json";
import englishMessages from "~/../messages/en.json";
import japaneseMessages from "~/../messages/ja.json";

export const locales = ["en", "ja"];
export type Locale = (typeof locales)[number];

export const defaultLocale = "en";
export type DefaultLocale = typeof defaultLocale;

export type Resources = typeof translations[DefaultLocale];
export type Namespace = keyof Resources;

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

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: "default";
		resources: Resources;
	}
}

function flat1<T extends Record<string, Record<string, ResourceKey>>>(value: T) {
	return Object.values(value).reduce((previous, current) => {
		return { ...previous, ...current };
	}, {});
}

const locale = "en";

export const translations = {
	en: {
		default: englishMessages,
		attributes: flat1(englishAttributeMessages),
		uppy: englishUppyMessages.strings,
	},
	ja: {
		default: japaneseMessages,
		attributes: flat1(japaneseAttributeMessages),
		uppy: japaneseUppyMessages.strings,
	}
};

i18n
	.use(icu)
	.use(initReactI18next)
	.init({
		lng: locale,
		fallbackLng: defaultLocale,
		ns: ["default"],
		defaultNS: "default",
		resources: translations,
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
