import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { Queue } from "./queue";

interface BrowsePageProps {
	params: Promise<{ locale: Locale }>;
}

// export function generateMetadata({ searchParams }: BrowsePageProps) {
// 	const { kind = "love" } = await searchParams;
//
// 	const t = await getTranslations();
//
// 	return {
// 		title: kind === "friend"
// 			? t("homie_mode")
// 			: t("browse")
// 	};
// }

export default function BrowsePage({ params }: BrowsePageProps) {
	const { locale } = use(params);
	setRequestLocale(locale);

	return <Queue />;
}
