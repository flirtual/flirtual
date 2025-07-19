import type {	ComponentProps, ComponentType, DispatchWithoutAction } from "react";
import { lazy as _lazy,	useEffect,	useState } from "react";

export interface LazyOptions {
	ssr?: boolean;
}

export function useHydrated() {
	const [hydrated, setHydrated] = useState(false);
	useHydratedCallback(() => setHydrated(true));

	return hydrated;
}

export function useHydratedCallback(callback: DispatchWithoutAction) {
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => callback(), []);
}

export function lazy<T extends ComponentType<any>>(load: () => Promise<{ default: T }>, { ssr = false }: LazyOptions = {}) {
	const LazyComponent = _lazy(load);
	if (ssr) return LazyComponent;

	return (props: ComponentProps<T>) => useHydrated()
		? <LazyComponent {...props} />
		: null;
}
