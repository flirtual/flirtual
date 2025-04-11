import { captureException } from "@sentry/nextjs";
import englishUppyMessages from "@uppy/locales/lib/en_US.js";
import japaneseUppyMessages from "@uppy/locales/lib/ja_JP.js";
import deepmerge from "deepmerge";
import type {
	AbstractIntlMessages,
	Locale,
	Messages,
	NamespaceKeys,
	NestedKeyOf
} from "next-intl";
import { hasLocale } from "next-intl";
import { getRequestConfig, setRequestLocale } from "next-intl/server";

import englishAttributeMessages from "~/../messages/attributes.en.json";
import japaneseAttributeMessages from "~/../messages/attributes.ja.json";
import englishMessages from "~/../messages/en.json";
import japaneseMessages from "~/../messages/ja.json";

import { defaultLocale, routing } from "./routing";

function flat1<T extends Record<string, Record<string, AbstractIntlMessages>>>(value: T) {
	return Object.values(value).reduce((previous, current) => {
		return { ...previous, ...current };
	}, {});
}

export const messages = {
	en: {
		...englishMessages,
		attributes: flat1(englishAttributeMessages),
		uppy: englishUppyMessages.strings
	},
	ja: {
		...japaneseMessages,
		attributes: flat1(japaneseAttributeMessages),
		uppy: japaneseUppyMessages.strings
	}
} satisfies Record<Locale, AbstractIntlMessages>;

export type MessageKeys = NamespaceKeys<Messages, NestedKeyOf<Messages>>;

export default getRequestConfig(async ({ requestLocale: requestLocalePromise }) => {
	const requestLocale = (await requestLocalePromise) as Locale;

	const locale = hasLocale(routing.locales, requestLocale)
		? requestLocale
		: routing.defaultLocale;

	setRequestLocale(locale);

	return {
		locale,
		messages: deepmerge(messages[defaultLocale], messages[locale]),
		onError: captureException
	};
});
