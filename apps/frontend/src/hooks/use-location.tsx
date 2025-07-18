import { useMemo } from "react";

import { usePathname, useSearchParams } from "~/i18n/navigation";
import { toAbsoluteUrl } from "~/urls";

export function useLocation() {
	const [searchParameters] = useSearchParams();
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
