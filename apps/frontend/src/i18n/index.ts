import { create as setupAcceptLanguage } from "accept-language";
import { headers as getHeaders } from "next/headers";
import { cache } from "react";

import type { PreferenceLanguage } from "~/api/user/preferences";

import settings from "../../project.inlang/settings.json";
import { Authentication } from "../api/auth";
import { polyfill } from "./polyfill";

const { languageTags: languages, sourceLanguageTag } = settings;

export const supportedLanguages = languages;
export const defaultLanguage = sourceLanguageTag;

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

export const getInternationalization = cache(async (override?: PreferenceLanguage) => {
	const headers = await getHeaders();

	override ||= headers.get("language") as PreferenceLanguage ?? undefined;

	const al = setupAcceptLanguage();
	al.languages(languages);

	const accept = headers.get("accept-language");
	const browser = al.get(accept) as PreferenceLanguage;

	const session = await Authentication.getOptionalSession();

	const preferred = session?.user.preferences?.language /* || browser */ || "en";

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
			fallback: "en" as const,
			override,
			preferred
		}
	};
});
