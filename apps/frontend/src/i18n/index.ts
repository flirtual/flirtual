import { cache } from "react";
import { create as setupAcceptLanguage } from "accept-language";
import { headers as getHeaders } from "next/headers";

import settings from "../../project.inlang/settings.json";
import { Authentication } from "../api/auth";

const { languageTags: languages, sourceLanguageTag } = settings;

function getCountry(headers: Headers) {
	const country =
		headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country");

	return country !== "XX" && country !== "T1"
		? (country?.toLowerCase() ?? null)
		: null;
}

export const getInternationalization = cache(async (override?: string) => {
	const headers = await getHeaders();

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

	await import("@formatjs/intl-displaynames/polyfill-force");
	await import(`@formatjs/intl-displaynames/locale-data/${current}`);

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
