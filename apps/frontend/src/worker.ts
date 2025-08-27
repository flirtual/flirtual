import { env } from "cloudflare:workers";
import { createPath } from "react-router";

import {
	defaultLocale,
	getLocale,
	getRecommendedLocale,
	replaceLanguage
} from "./i18n/languages";

export default {
	async fetch(request): Promise<Response> {
		const url = new URL(request.url);

		const currentLocale = getLocale(url.pathname, url.pathname);
		if (!currentLocale) {
			const recommendedLocale = getRecommendedLocale(request.headers.get("accept-language")) || defaultLocale;

			const probablyLoggedIn = request.headers.get("cookie")?.includes("session=");
			if (url.pathname === "/") url.pathname = probablyLoggedIn ? "/dates" : "/";

			const newUrl = new URL(createPath(replaceLanguage(url, recommendedLocale, url.pathname)), url);

			return new Response(null, {
				status: 301,
				headers: {
					location: newUrl.href,
					"cache-control": "public, max-age=3600, immutable",
					vary: "accept-language, cookie",
				}
			});
		}

		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
