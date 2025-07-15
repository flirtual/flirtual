import { configure } from "@ariesclark/eslint-config";

export default configure({
	next: false,
	tailwind: true,
	settings: {
		react: {
			version: 19
		}
	},
	ignores: [
		"next-env.d.ts",
		"paraglide/",
		"src/paraglide/",
		"messages/",
		"android/",
		"ios/",
		"visionos/",
	],
	rules: {
		"node/prefer-global/buffer": "off",
		"node/prefer-global/process": "off",
		"antfu/no-top-level-await": "off",
		"no-restricted-imports": [
			"error",
			{
				name: "next/link",
				message: "Use '~/components/link' instead."
			},
			{
				name: "next/router",
				message: "Use '~/i18n/navigation' instead."
			},
			{
				name: "next/navigation",
				message: "Use '~/i18n/navigation' instead."
			},
			{
				name: "swr",
				message: "Use '~/swr' instead."
			},
		]
	}
});
