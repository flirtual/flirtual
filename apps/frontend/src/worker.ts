import { create as createAcceptLanguage } from "accept-language";
import { env } from "cloudflare:workers";
import { createPath } from "react-router";

import { defaultLocale, getLanguage, locales, replaceLanguage } from "./i18n/languages";
import type { Locale } from "./i18n/languages";

const acceptLanguage = createAcceptLanguage();
acceptLanguage.languages([...locales]);

export default {
	async fetch(request): Promise<Response> {
		const url = new URL(request.url);

		const currentLocale = getLanguage(url.pathname, url.pathname);
		if (!currentLocale) {
			let suggestedLanguage = acceptLanguage.get(request.headers.get("accept-language")) as Locale || defaultLocale;
			if (!locales.includes(suggestedLanguage)) suggestedLanguage = defaultLocale;

			const newUrl = new URL(createPath(replaceLanguage(url, suggestedLanguage, url.pathname)), url);
			return new Response(null, {
				status: 301,
				headers: {
					location: newUrl.href,
					"cache-control": "public, max-age=3600, immutable",
					vary: "accept-language",
				}
			});
		}

		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
