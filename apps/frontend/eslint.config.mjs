import { config, configs } from "@ariesclark/eslint-config";
import tailwindcss from "@ariesclark/eslint-config/tailwindcss";
import nextjs from "@ariesclark/eslint-config/nextjs";

export default config({
	extends: [...configs.recommended, ...tailwindcss, ...nextjs],

	settings: {
		react: {
			version: "18"
		}
	},
	rules: {
		"@next/next/no-html-link-for-pages": "off",
		"sort-keys/sort-keys-fix": "off",
		"tailwindcss/no-custom-classname": "off"
	},
	ignores: [
		"**/node_modules/**",
		"**/.next/**",
		"ios/",
		"android/",
		"visionos/"
	]
});
