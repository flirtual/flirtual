import { Outlet } from "react-router";

import { isDesktop, useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";
import { defaultLocale, i18n, Navigate, redirect } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/layout";
import { SettingsNavigation } from "./navigation";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title"), name: t("settings") }
	]);
};

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
	const listOnly = request.url.endsWith(urls.settings.list());
	const desktop = isDesktop();

	if (listOnly && desktop) return redirect(urls.settings.matchmaking());
}

export default function SettingsLayout({ matches }: Route.ComponentProps) {
	const listOnly = matches.at(-1)?.id.endsWith("settings/page");
	const desktop = useScreenBreakpoint("desktop");

	if (listOnly && desktop) return <Navigate replace to={urls.settings.matchmaking()} />;

	return (
		<div className="flex w-full grow flex-col desktop:flex-row desktop:justify-center desktop:gap-8">
			<SettingsNavigation />
			<Outlet />
		</div>
	);
}
