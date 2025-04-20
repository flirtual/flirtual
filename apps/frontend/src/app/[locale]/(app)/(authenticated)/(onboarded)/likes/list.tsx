"use client";

import type { FC } from "react";

import { useLikesYou } from "~/hooks/use-likes-you";

import { LikeListItem } from "./list-item";

export const LikesList: FC = () => {
	const { items, count } = useLikesYou();
	const total = (count.love ?? 0) + (count.friend ?? 0);

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
			{items.length >= 100 && total > 100 && (
				<span className="text-center text-sm opacity-75">
					Like or pass profiles above to load older likes (showing 100/
					{total}
					)
				</span>
			)}
		</div>
	);
};
