import { configure } from "@ariesclark/eslint-config";

export default configure({
	next: true,
	tailwind: true,
	settings: {
		react: {
			version: 19
		}
	},
	ignores: [
		"next-env.d.ts",
		"paraglide/",
		"messages/",
		"android/",
		"ios/",
		"visionos/",
	],
	rules: {
		"node/prefer-global/buffer": "off",
		"node/prefer-global/process": "off",
		"no-restricted-imports": [
			"error",
			{
				name: "next/link",
				message: "Import from `~/components/link` instead."
			}
		]
	}
});
