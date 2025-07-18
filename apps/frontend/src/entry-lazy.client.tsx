import { App } from "@capacitor/app";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { applyDocumentMutations } from "./document";
import { i18n } from "./i18n";
import { preloadAll, restoreQueries, saveQueries } from "./query";
import { isRedirectError } from "./redirect";
import { urls } from "./urls";

App.addListener("appUrlOpen", async (event) => {
	const url = new URL(event.url);
	const pathname = url.href.replace(url.origin, "");

	location.href = pathname;
});

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter />
		</StrictMode>,
		{
			onCaughtError: (error) => {
				if (isRedirectError(error)) return;
				console.error("onCaught", error);
			},
			onRecoverableError: (error) => console.error("onRecoverable", error),
			onUncaughtError: (error) => console.error("onUncaught", error),
		}
	);
});

i18n.on("loaded", () => {
	// eslint-disable-next-line no-console
	console.log(
		`%c${i18n.t("console_message")}`,
		"padding: 0 0.5rem; background-image: linear-gradient(to right, #ff8975, #e9658b); color: white; white-space: pre; display: block; text-align: center; font-weight: bold; border-radius: .5rem",
		urls.resources.developers
	);
});

await restoreQueries();
await applyDocumentMutations();

window.addEventListener("beforeunload", saveQueries);
document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "visible") return;
	saveQueries();
});

preloadAll();
