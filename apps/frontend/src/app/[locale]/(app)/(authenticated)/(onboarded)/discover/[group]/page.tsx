import { useParams } from "react-router";

import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/root";

import type { Route } from "./+types/page";
import { Queue } from "./queue";

// eslint-disable-next-line unused-imports/no-unused-vars
const discoverGroups = ["dates", "homies"] as const;
export type DiscoverGroup = (typeof discoverGroups)[number];

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);
	const group = options.params.group ?? "dates";

	return metaMerge([
		...rootMeta(options),
		{
			title: group === "homies"
				? t("homie_mode")
				: t("browse")
		}
	]);
};

export default function DiscoverPage() {
	const { group } = useParams();

	return (
		<Queue
			kind={({
				dates: "love",
				homies: "friend"
			} as const)[group as DiscoverGroup] ?? "love"}
		/>
	);
}
