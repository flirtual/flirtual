import { SafeArea } from "@capacitor-community/safe-area";
import { App } from "@capacitor/app";

import { urls } from "~/urls";

import {
	preloadAll,
	restoreQueries,
	saveQueries
} from "./query";

// eslint-disable-next-line no-console
console.log(
	`%cWant to contribute to Flirtual?\n${urls.resources.developers}`,
	"padding: 1rem 2rem; background-image: linear-gradient(to right, #ff8975, #e9658b); color: white; white-space: pre; display: block; text-align: center; font-weight: bold; border-radius: .5rem",
);

await restoreQueries();

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

SafeArea.enable({
	config: {
		customColorsForSystemBars: true,
		statusBarColor: "#00000000",
		navigationBarColor: "#00000000",
		offset: 10
	}
});
