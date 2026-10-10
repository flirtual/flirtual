import { useCallback } from "react";

import { useNavigate } from "~/i18n";

// Back through history, or to the fallback when the page was opened directly.
export function useBack(fallback: string) {
	const navigate = useNavigate();

	return useCallback(() => {
		const index = (window.history.state as { idx?: number } | null)?.idx ?? 0;
		if (index > 0) void navigate(-1);
		else void navigate(fallback);
	}, [navigate, fallback]);
}
