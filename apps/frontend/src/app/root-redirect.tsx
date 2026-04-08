import type { ClientLoaderFunctionArgs } from "react-router";

import { redirect } from "~/i18n";
import { defaultLocale, getRecommendedLocale, replaceLanguage } from "~/i18n/languages";

export function clientLoader({ request }: ClientLoaderFunctionArgs) {
	const locale = getRecommendedLocale(navigator.languages.join(",")) || defaultLocale;
	const url = new URL(request.url);
	const { pathname } = replaceLanguage(url.pathname, locale, "/");
	throw redirect(`${pathname}${url.search}${url.hash}`);
}

export default function RootRedirect() {
	return null;
}
