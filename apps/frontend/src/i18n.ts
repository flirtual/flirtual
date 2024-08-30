import { getRequestConfig } from "next-intl/server";
import { create as setupAcceptLanguage } from "accept-language";
import { headers } from "next/headers";
import { cache } from "react";
import deepmerge from "deepmerge";

import { withOptionalSession } from "./server-utilities";

export const getInternationalization = cache(
	async (languageOverride?: string) => {
		if (!languageOverride)
			languageOverride = (await withOptionalSession())?.user.language;

		const { languageTags: languages, sourceLanguageTag } = await import(
			"../project.inlang/settings.json"
		);

		const al = setupAcceptLanguage();
		al.languages(languages);

		const accept = headers().get("accept-language");

		const ipCountry =
			headers().get("cf-ipcountry") || headers().get("x-vercel-ip-country");
		const country =
			ipCountry !== "XX" && ipCountry !== "T1"
				? (ipCountry?.toLowerCase() ?? null)
				: null;

		const browser = al.get(accept);

		const locale = languageOverride || browser || sourceLanguageTag;

		return {
			locale: {
				current: locale,
				browser,
				fallback: sourceLanguageTag
			},
			country,
			languages
		};
	}
);

export default getRequestConfig(async () => {
	const { locale } = await getInternationalization();

	const { default: fallback } = await import(
		`../messages/${locale.fallback}.json`
	);

	const { default: messages } =
		locale.current === locale.fallback
			? { default: fallback }
			: await import(`../messages/${locale.current}.json`);

	return {
		locale: locale.current,
		messages: deepmerge(fallback, messages)
	};
});
