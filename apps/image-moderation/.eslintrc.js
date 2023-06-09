require("@ariesclark/eslint-config/eslint-patch");
process.env["ESLINT_PROJECT_ROOT"] = __dirname;

module.exports = {
	extends: ["@ariesclark/eslint-config"],
	root: true,
	rules: {
		"import/no-named-as-default-member": "off"
	}
};
