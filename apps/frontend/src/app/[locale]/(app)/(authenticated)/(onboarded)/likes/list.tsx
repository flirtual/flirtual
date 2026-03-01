import type { FC } from "react";
import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import type { LikesYouFilters } from "~/api/matchmaking";
import { useLikesYou, useLikesYouPreview } from "~/hooks/use-likes-you";

import { LikeListItem } from "./list-item";

export interface LikesListProps {
	filters: LikesYouFilters;
}

export const LikesList: FC<LikesListProps> = ({ filters }) => {
	const { t } = useTranslation();
	const { data, loadMore } = useLikesYou(filters);
	const { count } = useLikesYouPreview();
	const items = data.flatMap((page) => page.data);
	const total = (count.love ?? 0) + (count.friend ?? 0);

	const [loadMoreReference, loadMoreInView] = useInView();

	useLayoutEffect(() => {
		if (!loadMoreInView) return;
		void loadMore();
	}, [loadMoreInView, loadMore]);

	const hasFilters = filters.kind || filters.gender;

	if (items.length === 0) return (
		<div className="flex flex-col gap-1 px-4 desktop:px-0">
			{hasFilters
				? <span className="text-xl font-semibold">{t("no_results")}</span>
				: (
						<>
							<span className="text-xl font-semibold">
								{t("no_likes_yet")}
							</span>
							<span>{t("no_likes_yet_description")}</span>
						</>
					)}
		</div>
	);

	return (
		<div className="flex flex-col gap-2 desktop:gap-4">
			{items.map((item) => <LikeListItem {...item} key={item.profileId} filters={filters} />)}
			{total > items.length && (
				<div className="h-4" ref={loadMoreReference} />
			)}
		</div>
	);
};
