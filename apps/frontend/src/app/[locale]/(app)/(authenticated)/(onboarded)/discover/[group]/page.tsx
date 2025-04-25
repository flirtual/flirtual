/* eslint-disable unicorn/prevent-abbreviations */

import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { Queue } from "./queue";

// eslint-disable-next-line unused-imports/no-unused-vars
const discoverGroups = ["love", "friends"] as const;
export type DiscoverGroup = (typeof discoverGroups)[number];

export function generateStaticParams() {
	return [{ group: "love" }, { group: "friends" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ group: DiscoverGroup }> }) {
	const { group = "love" } = await params;

	const t = await getTranslations();

	return {
		title: group === "friends"
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
				love: "love",
				friends: "friend"
			} as const)[group]}
		/>
	);
}
