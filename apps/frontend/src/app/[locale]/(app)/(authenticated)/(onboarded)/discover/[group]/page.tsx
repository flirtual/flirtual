/* eslint-disable unicorn/prevent-abbreviations */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import type { Locale } from "~/i18n";

import { Queue } from "./queue";

// eslint-disable-next-line unused-imports/no-unused-vars
const discoverGroups = ["dates", "homies"] as const;
export type DiscoverGroup = (typeof discoverGroups)[number];

export function generateStaticParams() {
	return [{ group: "dates" }, { group: "homies" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ group: DiscoverGroup }> }) {
	const { group = "dates" } = await params;

	const t = await getTranslations();

	return {
		title: group === "homies"
			? t("homie_mode")
			: t("browse")
	};
}

export default function DiscoverPage({ params }: { params: Promise<{ locale: Locale; group: DiscoverGroup }> }) {
	const { locale, group } = use(params);
	setRequestLocale(locale);

	return (
		<Queue
			kind={({
				dates: "love",
				homies: "friend"
			} as const)[group]}
		/>
	);
}
