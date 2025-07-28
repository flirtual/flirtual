import { useEffect, useState } from "react";

export function useHydrated() {
	const [hydrated, setHydrated] = useState(false);

	// eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
	useEffect(() => setHydrated(true), []);

	return hydrated;
}
