/* eslint-disable react-hooks/rules-of-hooks */
import { useDebugValue, useEffect, useState } from "react";

import { server } from "~/const";

export function useMediaQuery(media: string, defaultValue?: boolean) {
	useDebugValue(media);

	if (server && defaultValue !== undefined) return defaultValue;

	const [value, setValue] = useState(() => defaultValue ?? matchMedia(media).matches);
	useMediaQueryCallback(media, ({ matches }) => setValue(matches));

	return value;
}

export function useMediaQueryCallback(
	media: string,
	callback: (event: Pick<MediaQueryListEvent, "matches">) => void
) {
	useDebugValue(media);

	useEffect(() => {
		const queryList = matchMedia(media);
		callback(queryList);

		queryList.addEventListener("change", callback);
		return () => queryList.removeEventListener("change", callback);
	}, [media, callback]);
}
