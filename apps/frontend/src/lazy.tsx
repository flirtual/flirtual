import type {	ComponentType } from "react";
import { lazy as _lazy } from "react";
import { withSuspense } from "with-suspense";
import type { SuspenseOptions } from "with-suspense";

import { server } from "./const";

export interface LazyOptions<T> extends SuspenseOptions<T> {
	ssr?: boolean;
}

type LoadFunction<T> = (() => Promise<T> | T);

export function lazy<T extends object>(load: LoadFunction<ComponentType<T>>, { ssr = false, fallback, ...suspenseOptions }: LazyOptions<T> = {}) {
	const FallbackComponent = typeof fallback === "function" ? fallback : () => fallback;
	const LazyComponent = _lazy(async () => ({ default: await (typeof load === "function" ? load() : load) }));

	return withSuspense<T>((props) => {
		if (ssr) return <LazyComponent {...props} />;
		if (server) return <FallbackComponent {...props} />;

		return <LazyComponent {...props} />;
	}, suspenseOptions);
}
