import { App } from "@capacitor/app";

import { urls } from "~/urls";

import { applyDocumentMutations } from "./app/[locale]/lazy-layout";
import { guessLocale } from "./i18n/routing";
import {
	preloadAll,
	restoreQueries,
	saveQueries
} from "./query";

const translations = {
	en: () => import("~/../messages/en.json"),
	ja: () => import("~/../messages/ja.json"),
};

const locale = guessLocale();
const t = await translations[locale]();

// eslint-disable-next-line no-console
console.log(
	`%c${t.console_message}`,
	"padding: 0 0.5rem; background-image: linear-gradient(to right, #ff8975, #e9658b); color: white; white-space: pre; display: block; text-align: center; font-weight: bold; border-radius: .5rem",
	urls.resources.developers
);

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
