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
		"tailwindcss/no-custom-classname": "off",
		"react/no-unstable-nested-components": "off"
		// "react/jsx-no-literals": "warn"
	},
	ignores: [
		"**/node_modules/**",
		"**/.next/**",
		"ios/",
		"android/",
		"visionos/"
	]
});
