import { useCallback, useEffect } from "react";

import { useSessionUser } from "./use-session";

export function useFreshworks() {
	const openFreshworks = useCallback(() => window.FreshworksWidget("open"), []);
	const hideFreshworks = useCallback(() => window.FreshworksWidget("hide"), []);

	const user = useSessionUser();

	useEffect(() => {
		window.FreshworksWidget("identify", "ticketForm", {
			name: user?.profile.displayName || user?.username || "",
			email: user?.email || ""
		});
	}, [user]);

	return { openFreshworks, hideFreshworks };
}
