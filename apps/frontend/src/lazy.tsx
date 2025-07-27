import type {	ComponentProps, ComponentType } from "react";
import { lazy as _lazy, use } from "react";

import { hydratePromise } from "./hooks/use-hydrated";

export interface LazyOptions {
	ssr?: boolean;
}

type LoadFunction<T> = (() => Promise<T> | T);

export function lazy<T extends ComponentType<any>>(load: LoadFunction<T>, { ssr = false }: LazyOptions = {}) {
	const LazyComponent = _lazy(async () => ({ default: await (typeof load === "function" ? load() : load) }));
	if (ssr) return LazyComponent;

	return (props: ComponentProps<T>) => {
		use(hydratePromise);
		return <LazyComponent {...props} />;
	};
}
