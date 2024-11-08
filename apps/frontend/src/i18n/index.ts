import { create as setupAcceptLanguage } from "accept-language";
import { headers as getHeaders } from "next/headers";
import { cache } from "react";

import settings from "../../project.inlang/settings.json";
import { Authentication } from "../api/auth";
import { polyfill } from "./polyfill";

const { languageTags: languages, sourceLanguageTag } = settings;

function getCountry(headers: Headers) {
	const country
		= headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country");

	return country !== "XX" && country !== "T1"
		? (country?.toLowerCase() ?? null)
		: null;
}

function getTimezone(headers: Headers) {
	const timezone = headers.get("x-vercel-ip-timezone");
	return timezone || "America/New_York";
}

export const getInternationalization = cache(async (override?: string) => {
	const headers = await getHeaders();

	override ||= headers.get("language") ?? undefined;

	const al = setupAcceptLanguage();
	al.languages(languages);

	const accept = headers.get("accept-language");
	const browser = al.get(accept);

	const session = await Authentication.getOptionalSession();
	const translating
		= headers.has("translating") || session?.user.tags?.includes("translating");

	const preferred = session?.user.language || browser || sourceLanguageTag;

	if (override === preferred || (override && !languages.includes(override)))
		override = undefined;
	const current = override || preferred;
	await polyfill(current);

	const country = getCountry(headers);
	const timezone = getTimezone(headers);

	return {
		country,
		timezone,
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
