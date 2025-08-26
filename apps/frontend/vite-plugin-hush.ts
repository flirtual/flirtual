import type { Plugin } from "vite";

export function hush(messages: Array<RegExp | string>): Plugin {
	if (messages.length === 0)
		return {
			name: "hush",
		};

	const messageCounts: Array<number> = [];

	return {
		name: "hush",
		enforce: "pre",
		config: (userConfig) => ({
			build: {
				rollupOptions: {
					onwarn(warning, defaultHandler) {
						const messageIndex = messages.findIndex((message) => {
							if (typeof message === "string") return warning.message.includes(message);
							return message.test(warning.message);
						});

						if (messageIndex !== -1) {
							messageCounts[messageIndex] ??= 0;
							messageCounts[messageIndex]++;
							return;
						}

						if (userConfig.build?.rollupOptions?.onwarn)
							userConfig.build.rollupOptions.onwarn(warning, defaultHandler);
						else
							defaultHandler(warning);
					},
				},
			},
		}),
		closeBundle() {
			if (messageCounts.length === 0) return;

			this.warn(`Silenced the following messages: ${messages.map((message, index) => `\n  - ${message}: ${messageCounts[index] || 0}x`).join("")}`);
		},
	};
}
