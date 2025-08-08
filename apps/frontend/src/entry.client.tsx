import { App } from "@capacitor/app";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

// import { preloadAll, restoreQueries, saveQueries } from "./query";
import { isRedirectError } from "./redirect";

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter />
		</StrictMode>,
		{
			onCaughtError: (error) => {
				if (isRedirectError(error)) return;
				console.error(error);
			},
			onRecoverableError: (error) => console.warn(error),
			onUncaughtError: (error) => console.error("onUncaught", error),
		}
	);
});

App.addListener("appUrlOpen", async (event) => {
	const url = new URL(event.url);
	const href = url.href.replace(url.origin, "");

	location.href = href;
});

import("./analytics").then(({ initialize }) => initialize());

// await restoreQueries();
//
// window.addEventListener("beforeunload", saveQueries);
// document.addEventListener("visibilitychange", () => {
// 	if (document.visibilityState === "visible") return;
// 	saveQueries();
// });
//
// preloadAll();
//
