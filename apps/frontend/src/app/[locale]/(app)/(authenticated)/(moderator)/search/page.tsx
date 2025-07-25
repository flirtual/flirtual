import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/root";

import type { Route } from "./+types/page";
import { SearchView } from "./search-view";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);
	return metaMerge([...rootMeta(options), { title: "Search" }]);
};

export default function SearchPage() {
	return <SearchView />;
}
