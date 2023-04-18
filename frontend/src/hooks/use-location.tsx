import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { toAbsoluteUrl } from "~/urls";

export function useLocation() {
	const searchParams = useSearchParams();
	const pathname = usePathname();

	return useMemo(
		() =>
			toAbsoluteUrl(
				`${pathname}${
					Array.from(searchParams.keys()).length !== 0 ? `?${searchParams.toString()}` : ""
				}`
			),
		[searchParams, pathname]
	);
}
