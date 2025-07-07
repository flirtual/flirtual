import type { DispatchWithoutAction } from "react";
import { useEffect, useState } from "react";

export function useHydrated() {
	const [hydrated, setHydrated] = useState(false);
	useHydratedCallback(() => setHydrated(true));

	return hydrated;
}

export function useHydratedCallback(callback: DispatchWithoutAction) {
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => callback(), []);
}
