/// <reference types="@cloudflare/workers-types" />
/// <reference types="../../worker-configuration.d.ts" />

import { env } from "cloudflare:workers";
import { createPath } from "react-router";

import {
	defaultLocale,
	getLocale,
	getRecommendedLocale,
	isLocale,
	replaceLanguage
} from "../i18n/languages";
import { queue } from "./image-queue";

export default {
	async fetch(request): Promise<Response> {
		const url = new URL(request.url);

		const locale = getLocale(url.pathname, url.pathname);
		if (!locale) {
			const legacyLocale = url.searchParams.get("language");
			const recommendedLocale = getRecommendedLocale(request.headers.get("accept-language")) || defaultLocale;

			const locale = (legacyLocale && isLocale(legacyLocale) && legacyLocale) || recommendedLocale;

			const probablyLoggedIn = request.headers.get("cookie")?.includes("session=");
			if (url.pathname === "/") url.pathname = probablyLoggedIn ? "/dates" : "/";

			const newUrl = new URL(createPath(replaceLanguage(url, locale, url.pathname)), url);
			newUrl.searchParams.delete("language");

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
	queue
} satisfies ExportedHandler<Env, any>;
