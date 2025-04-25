"use client";

import { initialize as initializeSafeArea, SafeArea, type Config as SafeAreaConfig } from "@capacitor-community/safe-area";
import { useLocale } from "next-intl";
import { useLayoutEffect } from "react";
import { omitBy } from "remeda";
import { withSuspense } from "with-suspense";

import { device } from "~/hooks/use-device";
import { getTheme } from "~/hooks/use-theme";
import { log } from "~/log";

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
	const { platform, native, vision } = device;

	const { documentElement: element } = document;

	Object.assign(element.dataset, omitBy({
		theme,
		platform,
		native,
		vision
	}, (value) => !value));

	if (!element.style.getPropertyValue("--safe-area-inset-top")) initializeSafeArea();
	await SafeArea.enable({ config: safeArea });
}

export const LazyLayout = withSuspense(() => {
	const locale = useLocale();

	useLayoutEffect(() => {
		applyDocumentMutations();
		// On `locale` change, we lose any changes we've made to
		// the document element, so we'll need to re-apply them.
	}, [locale]);

	return null;
});
