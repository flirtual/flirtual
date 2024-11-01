"use client";

import type { FC } from "react";
import useSWR from "swr";

import { Matchmaking } from "~/api/matchmaking";
import { likesYouKey } from "~/swr";

import { LikeListItem } from "./list-item";

function useLikesYou() {
	const { data } = useSWR(likesYouKey(), async () => Matchmaking.likesYou(), { suspense: true });
	return data;
}

export const LikesList: FC = () => {
	const { items } = useLikesYou();

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
			{items.map((item) => <LikeListItem {...item} key={item.targetId} />)}
		</div>
	);
};
