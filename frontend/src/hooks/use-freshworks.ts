import { useCallback, useEffect, useState } from "react";

import { useSessionUser } from "./use-session";

declare global {
	interface Window {
		fwSettings: Record<string, unknown>;
		FreshworksWidget: {
			(...args: Array<unknown>): void;
			q: Array<unknown>;
		};
	}
}

const widgetId = 73000002566;

export function useFreshworks() {
	const [loaded, setLoaded] = useState(false);

	const loadFreshworks = useCallback(() => {
		if (loaded) return;

		const script = document.createElement("script");
		script.src = `https://widget.freshworks.com/widgets/${widgetId}.js`;

		document.body.appendChild(script);
		setLoaded(true);
	}, [loaded]);

	useEffect(() => {
		if (typeof window.FreshworksWidget !== "function") {
			window.FreshworksWidget = Object.assign(
				function () {
					loadFreshworks();
					// eslint-disable-next-line prefer-rest-params
					window.FreshworksWidget.q.push(arguments);
				},
				{ q: [] }
			);
		}

		window.fwSettings = { widget_id: widgetId };
	}, [loadFreshworks]);

	const openFreshworks = useCallback(() => window.FreshworksWidget("open"), []);
	const hideFreshworks = useCallback(() => window.FreshworksWidget("hide"), []);

	const user = useSessionUser();

	useEffect(() => {
		if (!loaded) return;

		window.FreshworksWidget("identify", "ticketForm", {
			name: user?.profile.displayName || user?.username || "",
			email: user?.email || ""
		});
	}, [loaded, user]);

	return { openFreshworks, hideFreshworks };
}
