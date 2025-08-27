import type { Config } from "@react-router/dev/config";
import { sentryOnBuildEnd } from "@sentry/react-router";

import { locales } from "./src/i18n/languages";

export default {
	future: {
		// unstable_subResourceIntegrity: true,
		unstable_splitRouteModules: false,
	},
	ssr: false,
	routeDiscovery: {
		mode: "initial"
	},
	appDirectory: "src",
	buildDirectory: "dist",
	buildEnd: sentryOnBuildEnd,
	prerender: [
		...[
			"",
			// "/login",
			// "/sign-up",
			// "/forgot",

			"/about",
			"/branding",
			"/download",
			"/events",
			"/guidelines",
			"/guides",
			"/guides/mental",
			"/payments",
			"/press",
			"/privacy",
			"/privacy-20221022",
			"/terms",
			"/terms-20230530",
		]
			.map((path) => locales.map((locale) => `/${locale}${path}`))
			.flat()
			.sort(),

		"/manifest.json",
		"/robots.txt",
		"/pico_authentication.json",
		"/.well-known/security.txt",
		"/_redirects",
		"/_headers",
		"/wrangler.json"
	]
} satisfies Config;
