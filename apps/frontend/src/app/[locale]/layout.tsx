import type { ClientLoaderFunctionArgs } from "react-router";
import { Outlet } from "react-router";

import { redirect } from "~/i18n";
import { defaultLocale, getRecommendedLocale, isLocale, replaceLanguage } from "~/i18n/languages";

export function clientLoader({ params, request }: ClientLoaderFunctionArgs) {
	const { locale } = params;
	if (locale && !isLocale(locale)) {
		const recommendedLocale = getRecommendedLocale(navigator.languages.join(",")) || defaultLocale;
		const url = new URL(request.url);
		const { pathname } = replaceLanguage(url.pathname, recommendedLocale, "/");
		throw redirect(`${pathname}${url.search}${url.hash}`);
	}
	return null;
}

export default function LocaleLayout() {
	return <Outlet />;
}
