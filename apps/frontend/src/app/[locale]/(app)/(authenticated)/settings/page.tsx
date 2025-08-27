import { useRevalidator } from "react-router";
import invariant from "tiny-invariant";

import { isDesktop, useBreakpointCallback } from "~/hooks/use-breakpoint";
import { i18n, redirect } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/layout";

export async function clientLoader() {
	if (isDesktop()) return redirect(urls.settings.matchmaking());
}

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title"), name: t("settings") }
	]);
};

export default function SettingsPage() {
	const { revalidate } = useRevalidator();
	useBreakpointCallback("desktop", revalidate);

	return null;
}
