import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { toAbsoluteUrl } from "~/urls";

export function useLocation() {
	const searchParams = Array.from(useSearchParams().entries());
	const pathname = usePathname();

	return useMemo(
		() =>
			toAbsoluteUrl(
				`${pathname}${
					searchParams.length !== 0
						? `?${searchParams.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")}`
						: ""
				}`
			),
		[searchParams, pathname]
	);
}
