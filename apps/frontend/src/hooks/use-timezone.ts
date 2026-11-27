import ms from "ms" with { type: "macro" };
import { useMemo } from "react";

import type { Timezone } from "~/api/timezones";
import { timezones as timezonesEnabled } from "~/features";
import { timezonesFetcher, timezonesKey, useQuery } from "~/query";

export function useTimezones(): Array<Timezone> {
	return useQuery({
		queryKey: timezonesKey(),
		queryFn: timezonesFetcher,
		staleTime: ms("1d")
	});
}

// Browser may report non-canonical tzdb zones from CLDR (e.g. Asia/Calcutta);
// we resolve links (Asia/Kolkata). Null for offset-only names (UTC, Etc/GMT+5).
function useListedBrowserTimezone(): string | null {
	const timezones = useTimezones();

	return useMemo(() => {
		const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		return timezones.find(({ id, aliases }) =>
			id === browserTimezone || aliases?.includes(browserTimezone))?.id ?? null;
	}, [timezones]);
}

export const useBrowserTimezone = timezonesEnabled ? useListedBrowserTimezone : () => null;
