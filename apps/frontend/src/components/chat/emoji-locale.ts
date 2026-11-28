import type { I18n } from "emoji-picker-element/shared";

const dataLanguages: Record<string, string> = {
	de: "de",
	es: "es",
	fr: "fr",
	ja: "ja",
	ko: "ko",
	nl: "nl",
	pt: "pt",
	"pt-BR": "pt",
	ru: "ru",
	sv: "sv"
};

const strings: Record<string, () => Promise<{ default: I18n }>> = {
	de: () => import("emoji-picker-element/i18n/de"),
	es: () => import("emoji-picker-element/i18n/es"),
	fr: () => import("emoji-picker-element/i18n/fr"),
	ja: () => import("emoji-picker-element/i18n/ja"),
	ko: () => import("./emoji-i18n/ko"),
	nl: () => import("emoji-picker-element/i18n/nl"),
	pt: () => import("emoji-picker-element/i18n/pt_PT"),
	"pt-BR": () => import("emoji-picker-element/i18n/pt_BR"),
	ru: () => import("emoji-picker-element/i18n/ru_RU"),
	sv: () => import("./emoji-i18n/sv")
};

export const defaultPickerLocale = "en";

export function pickerLocale(locale: string): string {
	return dataLanguages[locale] ? locale : defaultPickerLocale;
}

export function pickerDataSource(locale: string): string | undefined {
	const language = dataLanguages[locale];
	return language && `https://cdn.jsdelivr.net/npm/emoji-picker-element-data@^1/${language}/cldr-native/data.json`;
}

export async function pickerStrings(locale: string): Promise<I18n | undefined> {
	return (await strings[locale]?.())?.default;
}
