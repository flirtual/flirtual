import {
	initialize as initializeSafeArea,
	SafeArea

} from "@capacitor-community/safe-area";
import type { Config as SafeAreaConfig } from "@capacitor-community/safe-area";

import { device } from "~/hooks/use-device";
import { getTheme } from "~/hooks/use-theme";
import { localePathnameRegex } from "~/i18n";
import { log } from "~/log";
import { getPreferences } from "~/preferences";
import { urls } from "~/urls";

const safeArea: SafeAreaConfig = {
	customColorsForSystemBars: true,
	statusBarColor: "#00000000",
	navigationBarColor: "#00000000",
	offset: 10
};

export async function applyDocumentMutations() {
	return;
	log("applyDocumentMutations()");

	const { body: { style, dataset } } = document;
	if (!style.getPropertyValue("--safe-area-inset-top")) initializeSafeArea();

	const [theme, fontSize] = await Promise.all([
		getTheme(),
		getPreferences<number>("font_size"),
		SafeArea.enable({ config: safeArea })
	]);

	const themeStyle = location.pathname.replace(localePathnameRegex, "") === urls.discover("homies")
		? "friend"
		: "default";

	document.documentElement.style.setProperty("font-size", `${fontSize || 16}px`);

	const { platform, native, vision } = device;

	Object.assign(dataset, {
		theme,
		themeStyle,
		platform,
	});

	native ? dataset.native = "" : delete dataset.native;
	vision ? dataset.vision = "" : delete dataset.vision;
}
