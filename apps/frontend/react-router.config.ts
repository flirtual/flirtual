import type { Config } from "@react-router/dev/config";

const locales = ["en", "ja"];

export default {
	ssr: false,
	prerender: [
		// "/",
		"/home",
		"/login"
		// "/about",
	]
		.map((path) => [
			path,
			...locales.map((locale) => `/${locale}${path}`)
		])
		.flat(),
	appDirectory: "src"
} satisfies Config;
