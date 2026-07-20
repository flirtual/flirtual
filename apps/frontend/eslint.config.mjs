import { configure } from "@ariesclark/eslint-config";

export default configure({
	next: false,
	tailwind: true,
	settings: {
		react: {
			version: 19
		},
		tailwindcss: {
			config: "tailwind.config.js"
		}
	},
	ignores: [
		"paraglide/",
		"src/paraglide/",
		"messages/",
		"android/",
		"ios/",
		"visionos/",
		"**/*.md",
	],
	rules: {
		// todo: disable eventually, flags bug-prone code.
		"react-hooks-extra/no-direct-set-state-in-use-effect": "off",

		"node/prefer-global/buffer": "off",
		"node/prefer-global/process": "off",
		// "antfu/no-top-level-await": "off",
		"no-restricted-syntax": [
			"error",
			// Preserved from the base config, which this rule would otherwise replace.
			"TSEnumDeclaration[const=true]",
			"TSExportAssignment",
			{
				selector: "ImportDeclaration[source.value='ms']:not(:has(ImportAttribute[key.name='type'][value.value='macro']))",
				message: "Import \"ms\" with { type: \"macro\" } so values are inlined at build time."
			}
		],
		"no-restricted-imports": [
			"error",
			{
				paths: [
					{
						name: "react-router",
						importNames: ["Navigate", "useNavigate", "useMatch", "redirect"],
						message: "Import from \"~/i18n\" instead."
					}
				]
			}
		]
	}
});
