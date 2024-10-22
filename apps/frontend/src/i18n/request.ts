import { getRequestConfig } from "next-intl/server";
import { cache } from "react";
import deepmerge from "deepmerge";

import { getInternationalization } from ".";

import type {
	AbstractIntlMessages,
	NamespaceKeys,
	NestedKeyOf
} from "next-intl";

export type MessageKeys = NamespaceKeys<
	IntlMessages,
	NestedKeyOf<IntlMessages>
>;

async function getLanguageMessages(locale: string) {
	const { default: messages } = await import(
		`../../messages/${locale}.json`
	).catch(() => ({}));

	const attributes = (
		await import(`../../messages/attributes.${locale}.json`).catch(() => ({
			default: {}
		}))
	).default as Record<string, Record<string, unknown>>;

	return {
		...messages,
		attributes: Object.values(attributes).reduce((previous, current) => {
			return { ...previous, ...current };
		}, {})
	};
}

const getMessages = cache(async (): Promise<AbstractIntlMessages> => {
	const { locale, translating } = await getInternationalization();

	const fallback = await getLanguageMessages(locale.fallback);

	const current =
		locale.current === locale.fallback
			? fallback
			: await getLanguageMessages(locale.current);

	const preferred =
		locale.current === locale.preferred
			? current
			: await getLanguageMessages(locale.preferred);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const messages = deepmerge(fallback, current) as any;

	return {
		// If the user is translating, we will pretend that we don't have any messages.
		// This will force all translations to be shown as their raw strings.
		...(translating ? {} : messages),
		banners: {
			...(translating ? {} : messages.banners),
			translating: messages.banners.translating
		},
		_preferred: {
			banners: {
				language: preferred.banners?.language ?? messages.banners.language
			}
		}
	};
});

export default getRequestConfig(async () => {
	const { locale } = await getInternationalization();
	const messages = await getMessages();

	return {
		locale: locale.current,
		messages
	};
});
