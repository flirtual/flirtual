import type { Config } from "@react-router/dev/config";

const locales = ["en", "ja"];

export default {
	ssr: false,
	routeDiscovery: {
		mode: "initial"
	},
	prerender: [
		...locales.map((locale) => `/${locale}`),
		...[
			"/login",
			"/sign-up",
			"/forgot",

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
			.flat(),

		"/manifest.json",
		"/robots.txt",
		"/pico_authentication.json",
		"/.well-known/security.txt",
		"/_redirects",
		"/_headers",
		"/wrangler.json"
	],
	appDirectory: "src",
	buildDirectory: "dist",
	future: {
		unstable_subResourceIntegrity: true,
		unstable_splitRouteModules: false,
	}
} satisfies Config;
