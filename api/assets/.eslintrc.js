require("@ariesclark/eslint-config/eslint-patch");

module.exports = {
	root: true,
	extends: [
		"@ariesclark/eslint-config",
		"@ariesclark/eslint-config/dist/atoms/react",
		"@ariesclark/eslint-config/dist/atoms/tailwindcss"
	],
	parserOptions: {
		project: "tsconfig.json",
		tsconfigRootDir: __dirname,
		sourceType: "module"
	},
	rules: {
		"import/no-named-as-default": "off",
		"react/display-name": "off"
	}
};
