"use client";

import type { FC } from "react";
import useSWR from "swr";
import { twMerge } from "tailwind-merge";

import { Matchmaking } from "~/api/matchmaking";
import { ButtonLink } from "~/components/button";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { Image } from "~/components/image";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

function useLikes() {
	const { data: likes } = useSWR(
		"likes",
		() => {
			return Matchmaking.likesYou();
		},
		{
			suspense: true
		}
	);

	return likes;
}

export const LikesYouButton: FC = () => {
	const [session] = useSession();
	const likes = useLikes();

	if (!session) return null;
	const { user } = session;

	return (
		<ButtonLink
			className="w-full"
			href={user.subscription?.active ? urls.likes : urls.subscription.default}
			size="sm"
		>
			<div className="flex gap-8">
				{likes.thumbnails && likes.thumbnails.length > 0 && (
					<div className="flex items-center -space-x-2">
						{likes.thumbnails?.map((thumbnail) => (
							<Image
								alt="Like preview"
								className="aspect-square rounded-full border-2 border-white-10 object-cover shadow-brand-1"
								draggable={false}
								height={34}
								key={thumbnail}
								src={thumbnail}
								width={34}
							/>
						))}
					</div>
				)}
				<div
					className={twMerge(
						likes.thumbnails
						&& likes.thumbnails.length > 0
						&& "flex flex-col items-center"
					)}
				>
					See who likes you
					{" "}
					<span data-mask className="whitespace-nowrap">
						{likes.count.love && (
							<>
								(
								{likes.count.love > 99 ? "99+" : likes.count.love}
								<HeartIcon className="inline h-4" gradient={false} />
								)
							</>
						)}
						{" "}
						{likes.count.friend && (
							<>
								(
								{likes.count.friend > 99 ? "99+" : likes.count.friend}
								<PeaceIcon className="inline h-4" gradient={false} />
								)
							</>
						)}
					</span>
				</div>
			</div>
		</ButtonLink>
	);
};
