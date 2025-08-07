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
				paths: [
					{
						name: "react-router",
						importNames: ["Navigate", "useNavigate", "redirect"],
						message: "Import from \"~/i18n\" instead."
					}
				]
			}
		]
	}
});
