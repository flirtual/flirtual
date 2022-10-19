require("@ariesclark/eslint-config/eslint-patch");

module.exports = {
	root: true,
	extends: ["@ariesclark/eslint-config"],
	parserOptions: {
		project: "tsconfig.json",
		tsconfigRootDir: __dirname,
		sourceType: "module"
	},
	rules: {
		"import/no-named-as-default": "off"
	}
};
