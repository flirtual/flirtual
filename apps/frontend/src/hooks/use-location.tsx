import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { toAbsoluteUrl } from "~/urls";

export function useLocation() {
	const searchParameters = useSearchParams();
	const pathname = usePathname();

	return useMemo(
		() =>
			toAbsoluteUrl(
				`${pathname}${
					[...searchParameters.keys()].length === 0
						? ""
						: `?${searchParameters.toString()}`
				}`
			),
		[searchParameters, pathname]
	);
}
