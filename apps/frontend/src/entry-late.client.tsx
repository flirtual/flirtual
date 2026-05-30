import { App } from "@capacitor/app";
import { startTransition, StrictMode } from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { log } from "./log";
import { initializeMonitoring } from "./monitoring";
import { preloadAll } from "./query";
import { isRedirectError } from "./redirect";

App.addListener("appUrlOpen", async (event) => {
	const url = new URL(event.url);
	const href = url.href.replace(url.origin, "");

	location.href = href;
});

initializeMonitoring();

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
				},
				onRecoverableError: (reason) => {
					if (isRedirectError(reason) || isRedirectError((reason as { cause?: unknown })?.cause)) return;
					if (typeof reportError === "function") return reportError(reason);
					console.error(reason);
				}
			}
		);
	});
});

log("Client-side hydration complete");
