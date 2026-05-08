import type { ConfiguredMiddleware, WretchOptions } from "wretch";

export function delay(ms: (url: string, options: WretchOptions) => number): ConfiguredMiddleware {
	return (next) => {
		return async (url, options) => {
			options.headers ??= {};

			await new Promise((resolve) => setTimeout(resolve, ms(url, options)));

			return next(url, options);
		};
	};
}
