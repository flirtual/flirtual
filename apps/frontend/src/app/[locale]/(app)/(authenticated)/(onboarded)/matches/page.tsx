import invariant from "tiny-invariant";

import { useBreakpoint } from "~/hooks/use-breakpoint";
import { useHasConversations } from "~/hooks/use-conversations";
import { i18n, Navigate } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/page";
import { ConversationAside } from "./aside";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{
			title: t("page_title", { name: t("matches") })
		}
	]);
};

export default function ConversationListPage() {
	// Wide screens show the list beside the queue instead.
	const split = useBreakpoint("split");
	const hasConversations = useHasConversations();
	if (split && hasConversations) return <Navigate replace to={urls.discover("dates")} />;

	return <ConversationAside />;
}
