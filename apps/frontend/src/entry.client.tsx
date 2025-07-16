import { App } from "@capacitor/app";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { urls } from "~/urls";
import { applyDocumentMutations } from "./app/[locale]/lazy-layout";
import { i18n } from "./i18n";
import { log, logRendering } from "./log";
import {
	preloadAll,
	restoreQueries,
	saveQueries
} from "./query";

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

App.addListener("appUrlOpen", async (event) => {
	const url = new URL(event.url);
	const pathname = url.href.replace(url.origin, "");

	location.href = pathname;
});

logRendering("before transition");

startTransition(() => {
	logRendering("before hydrate");

	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter />
		</StrictMode>
	)

	logRendering("after hydrate");
});
