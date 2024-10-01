import { getRequestConfig } from "next-intl/server";
import { create as setupAcceptLanguage } from "accept-language";
import { headers as getHeaders } from "next/headers";
import { cache } from "react";
import deepmerge from "deepmerge";

import settings from "../project.inlang/settings.json";
const { languageTags: languages, sourceLanguageTag } = settings;

import { Authentication } from "./api/auth";

import type {
	AbstractIntlMessages,
	NamespaceKeys,
	NestedKeyOf
} from "next-intl";

export type MessageKeys = NamespaceKeys<
	IntlMessages,
	NestedKeyOf<IntlMessages>
>;

function getCountry(headers: Headers) {
	const country =
		headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country");

	return country !== "XX" && country !== "T1"
		? (country?.toLowerCase() ?? null)
		: null;
}

export const getInternationalization = cache(async (override?: string) => {
	const headers = getHeaders();

	override ||= headers.get("language") ?? undefined;

	const al = setupAcceptLanguage();
	al.languages(languages);

	const accept = headers.get("accept-language");
	const browser = al.get(accept);

	const session = await Authentication.getOptionalSession();
	const translating =
		headers.has("translating") || session?.user.tags?.includes("translating");

	const preferred = session?.user.language || browser || sourceLanguageTag;

	if (override === preferred || (override && !languages.includes(override)))
		override = undefined;
	const current = override || preferred;

	const country = getCountry(headers);

	return {
		country,
		languages,
		locale: {
			browser,
			current,
			fallback: sourceLanguageTag,
			override,
			preferred
		},
		translating
	};
});

async function getLanguageMessages(locale: string) {
	const { default: messages } = await import(
		`../messages/${locale}.json`
	).catch(() => ({}));

	const attributes = (
		await import(`../messages/attributes.${locale}.json`).catch(() => ({
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
