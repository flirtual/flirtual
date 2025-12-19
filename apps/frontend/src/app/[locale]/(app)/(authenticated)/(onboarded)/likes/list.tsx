import type { FC } from "react";
import { useLayoutEffect } from "react";
import { useInView } from "react-intersection-observer";

import { useLikesYou, useLikesYouPreview } from "~/hooks/use-likes-you";

import { LikeListItem } from "./list-item";

export const LikesList: FC = () => {
	const { data, loadMore } = useLikesYou();
	const { count } = useLikesYouPreview();
	const items = data.flatMap((page) => page.data);
	const total = (count.love ?? 0) + (count.friend ?? 0);

	const [loadMoreReference, loadMoreInView] = useInView();

	useLayoutEffect(() => {
		if (!loadMoreInView) return;
		void loadMore();
	}, [loadMoreInView, loadMore]);

	if (items.length === 0) return (
		<div className="flex flex-col gap-1 px-4 desktop:px-0">
			<span className="text-xl font-semibold">
				No one has liked you yet 😔
			</span>
			<span>But it&apos;s only a matter of time.</span>
		</div>
	);

	return (
		<div className="flex flex-col gap-2 desktop:gap-4">
			{items.map((item) => <LikeListItem {...item} key={item.profileId} />)}
			{total > items.length && (
				<div className="h-4" ref={loadMoreReference} />
			)}
		</div>
	);
};
