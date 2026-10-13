import { useCallback, useEffect } from "react";

import { useNavigate } from "~/i18n";

import { addUpTarget, goUp, previousInTab } from "./use-history-tabs";

// Back within the tab, or up to `fallback` if the page was opened from another tab.
export function useBack(fallback: string) {
	const navigate = useNavigate();

	useEffect(() => addUpTarget(fallback), [fallback]);

	return useCallback(() => {
		if (previousInTab()) void navigate(-1);
		else goUp(fallback);
	}, [navigate, fallback]);
}
