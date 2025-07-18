import type { Locale } from "~/i18n";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { SearchView } from "./search-view";

export default function SearchPage() {
	const { locale } = use(params);
	setRequestLocale(locale);

	return <SearchView />;
}
