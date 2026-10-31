import { Outlet } from "react-router";
import invariant from "tiny-invariant";

import { ModelCardBack } from "~/components/model-card";
import { SplitPanes } from "~/components/split-panes";
import { isDesktop, isSplit, useBreakpoint } from "~/hooks/use-breakpoint";
import { defaultLocale, i18n, Navigate, redirect } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/layout";
import { SettingsNavigation } from "./navigation";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("settings") }) }
	]);
};

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
	const listOnly = request.url.endsWith(urls.settings.list());

	if (listOnly && (isSplit() || isDesktop())) return redirect(urls.settings.matchmaking());
}

export default function SettingsLayout({ matches }: Route.ComponentProps) {
	const listOnly = matches.at(-1)?.id.endsWith("settings/page");
	const split = useBreakpoint("split");
	const desktop = useBreakpoint("desktop");

	if (listOnly && (split || desktop)) return <Navigate replace to={urls.settings.matchmaking()} />;

	return (
		<SplitPanes aside={<SettingsNavigation />} asideClassName="desktop:w-80" className="desktop:gap-8" mainClassName="**:data-model-card-title:split:min-h-(--status-bar-height,0rem) **:data-model-card-title:split:py-4 **:data-model-card-title:split:pt-[max(calc(var(--status-bar-inset-top,var(--safe-area-inset-top,0rem))+0.5rem),1rem)] **:data-model-card-title:split:text-2xl desktop:max-w-lg desktop:**:data-model-card-title:pt-4.5">
			{listOnly ? <Outlet /> : <ModelCardBack><Outlet /></ModelCardBack>}
		</SplitPanes>
	);
}
