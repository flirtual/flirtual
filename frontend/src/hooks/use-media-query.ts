import { useDebugValue, useEffect, useState } from "react";

export function useMediaQuery(query: string) {
	const [matches, setMatches] = useState(false);

	useDebugValue(query);

	useEffect(() => {
		const queryList = matchMedia(query);
		setMatches(queryList.matches);

		const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);

		queryList.addEventListener("change", onChange);
		return () => queryList.removeEventListener("change", onChange);
	}, [query]);

	return matches;
}
