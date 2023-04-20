import { useCallback, useEffect, useState } from "react";

import { displayName } from "~/api/user";

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

	const user = useSessionUser();

	const openFreshworks = useCallback(() => {
		window.FreshworksWidget("identify", "ticketForm", {
			name: user ? displayName(user) : "",
			email: user?.email || ""
		});

		window.FreshworksWidget("open");
	}, [user]);

	const hideFreshworks = useCallback(() => window.FreshworksWidget("hide"), []);

	return { openFreshworks, hideFreshworks };
}
