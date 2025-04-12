import { useLocale } from "next-intl";
import { useCallback, useEffect } from "react";
import { unstable_serialize, useSWRConfig } from "~/swr";

import { displayName } from "~/api/user";
import { freshworksWidgetId } from "~/const";
import { sessionKey } from "~/swr";

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
	const { cache } = useSWRConfig();
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

	const openFreshworks = useCallback(() => {
		const { data: session } = cache.get(unstable_serialize(sessionKey())) || {};

		window.FreshworksWidget("identify", "ticketForm", {
			name: session?.user ? displayName(session?.user) : "",
			email: session?.user?.email || ""
		});

		window.FreshworksWidget("open");
		window.FreshworksWidget("hide", "launcher");
	}, [cache]);

	const hideFreshworks = useCallback(() => window.FreshworksWidget("hide"), []);

	return { openFreshworks, hideFreshworks };
}
