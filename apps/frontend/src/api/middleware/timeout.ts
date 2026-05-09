import type { ConfiguredMiddleware } from "wretch";

export function timeout(ms: number): ConfiguredMiddleware {
	return (next) => async (url, options) => {
		const controller = new AbortController();
		const userSignal = options.signal as AbortSignal | undefined;

		const onUserAbort = () => controller.abort(userSignal?.reason);
		if (userSignal) {
			if (userSignal.aborted) onUserAbort();
			else userSignal.addEventListener("abort", onUserAbort, { once: true });
		}

		const timer = setTimeout(
			() => controller.abort(new DOMException("signal timed out", "TimeoutError")),
			ms
		);

		try {
			return await next(url, { ...options, signal: controller.signal });
		}
		finally {
			clearTimeout(timer);
			userSignal?.removeEventListener("abort", onUserAbort);
		}
	};
}
