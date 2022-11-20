import { useCallback, useEffect } from "react";

import { useCurrentUser } from "./use-current-user";

export function useFreshworks() {
	const openFreshworks = useCallback(() => window.FreshworksWidget("open"), []);
	const hideFreshworks = useCallback(() => window.FreshworksWidget("hide"), []);

	const { data: user } = useCurrentUser();

	useEffect(() => {
		if (!user) return;

		window.FreshworksWidget("identify", "ticketForm", {
			name: user.profile.displayName || user.username,
			email: user.email
		});
	}, [user]);

	return { openFreshworks, hideFreshworks };
}
