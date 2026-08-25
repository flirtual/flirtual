import type { Config } from "@react-router/dev/config";
import { sentryOnBuildEnd } from "@sentry/react-router";

import { locales } from "./src/i18n/languages";

export default {
	splitRouteModules: false,
	ssr: false,
	routeDiscovery: {
		mode: "initial"
	},
	appDirectory: "src",
	buildDirectory: "dist",
	buildEnd: (build) => {
		// Sentry is optional, so we check if the config is present before calling the function.
		// https://github.com/getsentry/sentry-javascript/blob/develop/packages/react-router/src/vite/buildEnd/handleOnBuildEnd.ts#L13
		if ("sentryConfig" in build.viteConfig) sentryOnBuildEnd(build);
	},
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
		"/.well-known/assetlinks.json",
		"/.well-known/apple-app-site-association",
		"/.well-known/apple-developer-merchantid-domain-association",
		"/.well-known/webauthn",
		"/_redirects",
		"/_headers",
		"/wrangler.json"
	]
} satisfies Config;
