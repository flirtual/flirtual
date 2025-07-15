import type { Locale } from "~/i18n";
import { headers as getHeaders } from "next/headers";

import type { messages } from "./request";
import type { locales } from "./routing";

declare module "next-intl" {
	interface AppConfig {
		Locale: (typeof locales)[number];
		Messages: typeof messages[Locale];
	}
}

export async function getCountry() {
	const headers = await getHeaders();

	const country
		= headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country");

	return country !== "XX" && country !== "T1"
		? (country?.toLowerCase() ?? null)
		: null;
}

export async function getTimezone() {
	const headers = await getHeaders();

	const timezone = headers.get("x-vercel-ip-timezone");
	return timezone || "America/New_York";
}

/* export const getInternationalization = cache(async (override?: PreferenceLanguage) => {
	const headers = await getHeaders();

	override ||= headers.get("language") as PreferenceLanguage ?? undefined;

	const al = setupAcceptLanguage();
	al.languages(languages);

	const accept = headers.get("accept-language");
	const browser = al.get(accept) as PreferenceLanguage;

	const session = null; // await Authentication.getOptionalSession();

	const preferred = session?.user.preferences?.language  || browser  || "en";

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
}); */
