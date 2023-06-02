require("@ariesclark/eslint-config/eslint-patch");
process.env["ESLINT_PROJECT_ROOT"] = __dirname;

module.exports = {
	extends: ["@ariesclark/eslint-config", "@ariesclark/eslint-config/next", "@ariesclark/eslint-config/tailwindcss"],
	root: true,
	rules: {
		"@next/next/no-html-link-for-pages": "off"
	}
};