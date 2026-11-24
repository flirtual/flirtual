import { useMemo } from "react";

import { timezones as timezonesEnabled } from "~/features";

import { useAttributes } from "./use-attribute";

// Browser may report non-canonical tzdb zones from CLDR (e.g. Asia/Calcutta);
// we resolve links (Asia/Kolkata). Null for offset-only names (UTC, Etc/GMT+5).
function useListedBrowserTimezone(): string | null {
	const timezones = useAttributes("timezone");

	return useMemo(() => {
		const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		return timezones.find(({ id, aliases }) =>
			id === browserTimezone || aliases?.includes(browserTimezone))?.id ?? null;
	}, [timezones]);
}

export const useBrowserTimezone = timezonesEnabled ? useListedBrowserTimezone : () => null;
