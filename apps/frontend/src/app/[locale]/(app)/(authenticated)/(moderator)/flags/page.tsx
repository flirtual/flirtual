import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";

import type { Route } from "./+types/page";
import { FlagsView } from "./flags-view";

export const meta: Route.MetaFunction = (options) => {
	const { params: { locale } } = options;
	const t = i18n.getFixedT(locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{
			title: t("page_title", {
				name: "Flags"
			})
		}
	]);
};

export default function FlagsPage() {
	return <FlagsView />;
}
