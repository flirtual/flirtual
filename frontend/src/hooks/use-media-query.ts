import { useEffect, useMemo, useState } from "react";

export function useMediaQuery(query: string) {
	const queryList = useMemo(() => matchMedia(query), [query]);
	const [matches, setMatches] = useState(queryList.matches);

	useEffect(() => {
		const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);

		queryList.addEventListener("change", onChange);
		return () => queryList.removeEventListener("change", onChange);
	}, [queryList]);

	return matches;
}
