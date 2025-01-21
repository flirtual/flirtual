import { useLocale } from "next-intl";
import { useCallback, useEffect } from "react";

import { displayName } from "~/api/user";
import { freshworksWidgetId } from "~/const";

import { useCurrentUser } from "./use-session";

declare global {
	interface Window {
		fwSettings: Record<string, unknown>;
		FreshworksWidget: {
			(...arguments_: Array<unknown>): void;
			q: Array<unknown>;
		};
	}
}

let loaded = false;

export function useFreshworks() {
	const locale = useLocale();

	const loadFreshworks = useCallback(() => {
		if (loaded) return;

		const script = document.createElement("script");
		script.src = `https://widget.freshworks.com/widgets/${freshworksWidgetId}.js`;

		document.body.append(script);
		loaded = true;
	}, []);

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

		window.fwSettings = { widget_id: freshworksWidgetId, locale };
	}, [loadFreshworks, locale]);

	const user = useCurrentUser();

	const openFreshworks = useCallback(() => {
		window.FreshworksWidget("identify", "ticketForm", {
			name: user ? displayName(user) : "",
			email: user?.email || ""
		});

		window.FreshworksWidget("open");
		window.FreshworksWidget("hide", "launcher");
	}, [user]);

	const hideFreshworks = useCallback(() => window.FreshworksWidget("hide"), []);

	return { openFreshworks, hideFreshworks };
}
