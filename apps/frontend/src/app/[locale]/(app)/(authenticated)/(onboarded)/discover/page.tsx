import invariant from "tiny-invariant";

import { prospectKinds } from "~/api/matchmaking";
import { preloadProfileAttributes } from "~/components/profile";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { preload, queueFetcher, queueKey } from "~/query";

import type { Route } from "./+types/page";
import { Queue } from "./queue";

// eslint-disable-next-line unused-imports/no-unused-vars
const discoverGroups = ["dates", "homies"] as const;
export type DiscoverGroup = (typeof discoverGroups)[number];

export const meta: Route.MetaFunction = (options) => {
	const { params: { locale }, matches: [,,,,{ id: group }] } = options;
	invariant(isLocale(locale));

	const t = i18n.getFixedT(locale);

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

export const handle = {
	preload: () => Promise.all([
		preloadProfileAttributes(),
		...prospectKinds.map((prospectKind) => preload({
			queryKey: queueKey(prospectKind),
			queryFn: queueFetcher
		}))
	])
};

export const clientLoader = handle.preload;

export default function DiscoverPage({ matches: [,,,,{ id: group }] }: Route.ComponentProps) {
	return (
		<Queue
			kind={({
				dates: "love",
				homies: "friend"
			} as const)[group] ?? "love"}
		/>
	);
}
