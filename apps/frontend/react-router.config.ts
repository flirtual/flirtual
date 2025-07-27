import type { Config } from "@react-router/dev/config";

const locales = ["en", "ja"];

export default {
	ssr: false,
	prerender: [
		...locales.map((locale) => `/${locale}`),
		...[
			// "/",
			// "/home",

			"/login",
			"/sign-up",
			"/forgot",

			"/about",
			"/branding",
			"/debugger",
			"/download",
			"/events",
			"/guidelines",
			"/guides",
			// "/guides/mental",
			"/payments",
			"/press",
			"/privacy",
			"/privacy-20221022",
			"/terms",
			"/terms-20230530",
		]
			.map((path) => [
				// path,
				...locales.map((locale) => `/${locale}${path}`)
			])
			.flat(),

		"/manifest.json",
		"/robots.txt",
		"/pico_authentication.json",
		"/.well-known/security.txt",
		"/_redirects",
		"/_headers"
	],
	appDirectory: "src",
	buildDirectory: "dist",
	future: {
		// unstable_viteEnvironmentApi: true,
		unstable_splitRouteModules: "enforce",
	}
} satisfies Config;
