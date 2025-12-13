import { App } from "@capacitor/app";
import { startTransition, StrictMode } from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { log } from "./log";
import { preloadAll } from "./query";
import { isRedirectError } from "./redirect";

App.addListener("appUrlOpen", async (event) => {
	const url = new URL(event.url);
	const href = url.href.replace(url.origin, "");

	location.href = href;
});

import("./monitoring").then(({ initializeMonitoring }) => initializeMonitoring());

// await restoreQueries();
//
// window.addEventListener("beforeunload", saveQueries);
// document.addEventListener("visibilitychange", () => {
// 	if (document.visibilityState === "visible") return;
// 	saveQueries();
// });
//
preloadAll();
//

// eslint-disable-next-line react-dom/no-flush-sync
flushSync(() => {
	startTransition(() => {
		hydrateRoot(
			document,
			<StrictMode>
				<HydratedRouter />
			</StrictMode>,
			{
				onCaughtError: (reason) => {
					if (isRedirectError(reason)) return;
					console.error(reason);
				}
			}
		);
	});
});

log("Client-side hydration complete");
