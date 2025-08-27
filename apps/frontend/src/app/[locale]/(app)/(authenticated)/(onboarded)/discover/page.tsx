import { useMatches, useParams } from "react-router";

import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";

import type { Route } from "./+types/page";
import { Queue } from "./queue";

// eslint-disable-next-line unused-imports/no-unused-vars
const discoverGroups = ["dates", "homies"] as const;
export type DiscoverGroup = (typeof discoverGroups)[number];

export const meta: Route.MetaFunction = (options) => {
	const { params: { locale }, matches } = options;

	const { id: group } = matches[4];
	const t = i18n.getFixedT(locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{
			title: t("page_title", {
				name: group === "homies"
					? t("homie_mode")
					: t("browse")
			})
		}
	]);
};

export default function DiscoverPage({ matches: [,,,,{ id: group }] }: Route.ComponentProps) {
	return (
		<Queue
			kind={({
				dates: "love",
				homies: "friend"
			} as const)[group as DiscoverGroup] ?? "love"}
		/>
	);
}
