import type { ConfiguredMiddleware } from "wretch";

export function timeout(ms: number): ConfiguredMiddleware {
	return (next) => (url, options) => {
		const signal = AbortSignal.timeout(ms);

		return next(url, {
			...options,
			signal: options.signal
				? AbortSignal.any([options.signal, signal])
				: signal
		});
	};
}
