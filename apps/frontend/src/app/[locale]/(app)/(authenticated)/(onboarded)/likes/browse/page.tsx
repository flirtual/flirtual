import { AnimatePresence, m } from "motion/react";
import { useLocation } from "react-router";
import invariant from "tiny-invariant";

import type { LikesYouFilters } from "~/api/matchmaking";
import { preloadProfileAttributes, Profile } from "~/components/profile";
import { useLikesQueue } from "~/hooks/use-likes-queue";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";

import type { Route } from "./+types/page";
import { LikesQueueActions } from "./queue-actions";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{
			title: t("page_title", { name: t("likes_you") })
		}
	]);
};

export const handle = {
	preload: preloadProfileAttributes
};

export const clientLoader = handle.preload;

interface LocationState {
	filters?: LikesYouFilters;
	initialUserId?: string;
}

export default function LikesBrowsePage() {
	const location = useLocation();
	const { filters, initialUserId } = (location.state ?? {}) as LocationState;

	const { current } = useLikesQueue("love", { filters, initialUserId });

	if (!current) return null;

	return (
		<>
			<div className="relative w-full max-w-full gap-4 desktop:w-auto">
				<AnimatePresence initial={false}>
					<m.div
						key={current}
						animate={{ opacity: 1 }}
						className="relative top-0 z-10"
						exit={{ opacity: 0, position: "absolute" }}
						initial={{ opacity: 0 }}
					>
						<Profile userId={current} />
					</m.div>
				</AnimatePresence>
			</div>

			<LikesQueueActions filters={filters} initialUserId={initialUserId} kind="love" />
		</>
	);
}
