import type { Config } from "@react-router/dev/config";

const locales = ["en", "ja"];

export default {
	ssr: false,
	prerender: [
		...[
			// "/",
			"/home",

			"/login",
			"/sign-up",
			"/forgot",

			// "/about",
		]
			.map((path) => [
				path,
				...locales.map((locale) => `/${locale}${path}`)
			])
			.flat(),

		// Static files, not in public folder.
		// Keep in sync with routes.ts.
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
		unstable_viteEnvironmentApi: true,
		unstable_splitRouteModules: "enforce",
	}
} satisfies Config;
