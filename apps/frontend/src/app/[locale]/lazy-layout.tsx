import {
	initialize as initializeSafeArea,
	SafeArea,
	type Config as SafeAreaConfig
} from "@capacitor-community/safe-area";
import { useLayoutEffect } from "react";
import { useLocation } from "react-router";
import { omitBy } from "remeda";
import { withSuspense } from "with-suspense";

import { device } from "~/hooks/use-device";
import { getTheme } from "~/hooks/use-theme";
import { localePathnameRegex, useLocale } from "~/i18n";
import { log } from "~/log";
import { getPreferences } from "~/preferences";
import { urls } from "~/urls";

// import { defaultFontSize } from "./(app)/(authenticated)/settings/(account)/appearance/form";

const safeArea: SafeAreaConfig = {
	customColorsForSystemBars: true,
	statusBarColor: "#00000000",
	navigationBarColor: "#00000000",
	offset: 10
};

// eslint-disable-next-line react-refresh/only-export-components
export async function applyDocumentMutations() {
	log("%s()", applyDocumentMutations.name);

	const theme = await getTheme();
	const themeStyle = location.pathname.replace(localePathnameRegex, "") === urls.discover("homies")
		? "friend"
		: "default";

	const fontSizePromise = getPreferences<number>("font_size").then((fontSize) => {
		document.documentElement.style.setProperty("font-size", `${fontSize || 16}px`);
	});

	const { platform, native, vision } = device;

	const { body: element } = document;

	Object.assign(element.dataset, omitBy({
		theme,
		themeStyle,
		platform,
		native,
		vision
	}, (value) => !value));

	if (!element.style.getPropertyValue("--safe-area-inset-top")) initializeSafeArea();
	const safeAreaPromise = SafeArea.enable({ config: safeArea });

	await Promise.all([
		fontSizePromise,
		safeAreaPromise
	]);
}

export const LazyLayout = withSuspense(() => {
	const locale = useLocale();
	const location = useLocation();

	useLayoutEffect(() => {
		applyDocumentMutations();
		// On `locale` change, we lose any changes we've made to
		// the document element, so we'll need to re-apply them.
	}, [locale, location]);

	return null;
});
