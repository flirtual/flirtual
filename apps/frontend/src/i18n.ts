import { getRequestConfig } from "next-intl/server";
import { create as setupAcceptLanguage } from "accept-language";
import { headers as getHeaders } from "next/headers";
import { cache } from "react";
import deepmerge from "deepmerge";

import { getOptionalSession } from "./server-utilities";

import type { AbstractIntlMessages } from "next-intl";

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

	const { languageTags: languages, sourceLanguageTag: fallback } = await import(
		"../project.inlang/settings.json"
	);

	const al = setupAcceptLanguage();
	al.languages(languages);

	const accept = headers.get("accept-language");

	const browser = al.get(accept);
	const preferred =
		(await getOptionalSession())?.user.language || browser || fallback;

	if (override === preferred) override = undefined;
	const current = override || preferred;

	const country = getCountry(headers);

	return {
		locale: {
			current,
			preferred,
			browser,
			fallback,
			override
		},
		country,
		languages
	};
});

const getMessages = cache(async (): Promise<AbstractIntlMessages> => {
	const { locale } = await getInternationalization();

	const { default: fallback } = await import(
		`../messages/${locale.fallback}.json`
	);

	const { default: current } =
		locale.current === locale.fallback
			? { default: fallback }
			: await import(`../messages/${locale.current}.json`);

	const { default: preferred } =
		locale.current === locale.preferred
			? { default: current }
			: await import(`../messages/${locale.preferred}.json`);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const messages = deepmerge(fallback, current) as any;

	return {
		...messages,
		// Some translations are shown when the current language is different from the preferred language.
		// But we don't want to include all the translations, so we only include the ones that are relevant.
		[`$${locale.preferred}`]: {
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
