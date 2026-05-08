import type { ConfiguredMiddleware } from "wretch";

export function timeout(ms: number): ConfiguredMiddleware {
	return (next) => async (url, options) => {
		const signal = AbortSignal.timeout(ms);

		return next(url, {
			...options,
			signal: options.signal
				? AbortSignal.any([signal, options.signal])
				: signal
		});
	};
}
