import type { I18n } from "emoji-picker-element/shared";

export const defaultPickerLocale = "en";

export function pickerLocale(_locale: string): string {
	return defaultPickerLocale;
}

export function pickerDataSource(_locale: string): string | undefined {
	return undefined;
}

export async function pickerStrings(_locale: string): Promise<I18n | undefined> {
	return undefined;
}
