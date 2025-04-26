"use client";

import { initialize as initializeSafeArea, SafeArea, type Config as SafeAreaConfig } from "@capacitor-community/safe-area";
import { useLocale } from "next-intl";
import { useLayoutEffect } from "react";
import { omitBy } from "remeda";
import { withSuspense } from "with-suspense";

import { device } from "~/hooks/use-device";
import { getTheme } from "~/hooks/use-theme";
import { usePathname } from "~/i18n/navigation";
import { log } from "~/log";
import { getPreferences } from "~/preferences";

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

	const theme = getTheme();
	const themeStyle = location.pathname === "/discover/friends"
		? "friend"
		: "default";

	// const fontSize = await getPreferences<number>("font_size") || defaultFontSize;
	const fontSize = await getPreferences<number>("font_size") || 16;
	document.documentElement.style.setProperty("font-size", `${fontSize}px`);

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
	await SafeArea.enable({ config: safeArea });
}

export const LazyLayout = withSuspense(() => {
	const locale = useLocale();
	const pathname = usePathname();

	useLayoutEffect(() => {
		applyDocumentMutations();
		// On `locale` change, we lose any changes we've made to
		// the document element, so we'll need to re-apply them.
	}, [locale, pathname]);

	return null;
});
