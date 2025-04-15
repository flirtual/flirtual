/* eslint-disable no-console */

import { SafeArea } from "@capacitor-community/safe-area";
import { App } from "@capacitor/app";

import { preloadAll } from "~/swr";
import { urls } from "~/urls";

import { device } from "./hooks/use-device";

// We want to begin sending requests as soon as possible, so we can use them later.
// If we didn't, we'd end up with water-falling requests, which would be bad for performance.
await preloadAll();

console.log(
	`%cWant to contribute to Flirtual?\n${urls.resources.developers}`,
	"padding: 1rem 2rem; background-color: black; color: white; white-space: pre; display: block; text-align: center;",
	device
);

await App.addListener("appUrlOpen", async (event) => {
	const url = new URL(event.url);
	const pathname = url.href.replace(url.origin, "");

	location.href = pathname;
});

await SafeArea.enable({
	config: {
		customColorsForSystemBars: true,
		statusBarColor: "#00000000",
		navigationBarColor: "#00000000",
		offset: 10
	}
});
