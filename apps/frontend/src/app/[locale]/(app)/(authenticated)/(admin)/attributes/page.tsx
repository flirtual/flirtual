import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";

import type { Route } from "./+types/page";
import { AttributesView } from "./attributes-view";

export const meta: Route.MetaFunction = (options) => {
	const { params: { locale } } = options;
	const t = i18n.getFixedT(locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{
			title: t("page_title", {
				name: "Attributes"
			})
		}
	]);
};

export default function AttributesPage() {
	return <AttributesView />;
}
