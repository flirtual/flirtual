import { configure } from "@ariesclark/eslint-config";

export default configure({
	next: true,
	tailwind: true,
	settings: {
		react: {
			version: 19
		}
	},
	rules: {
		"node/prefer-global/buffer": "off"
	}
});
