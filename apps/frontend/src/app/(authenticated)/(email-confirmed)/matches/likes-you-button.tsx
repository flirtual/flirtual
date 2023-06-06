"use client";

import { FC } from "react";
import useSWR from "swr";

import { ButtonLink } from "~/components/button";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { api } from "~/api";
import { urls } from "~/urls";
import { useSession } from "~/hooks/use-session";

export const LikesYouButton: FC = () => {
	const [session] = useSession();
	const { data: likes } = useSWR(
		"likes",
		() => {
			return api.matchmaking.listMatches({
				query: {
					unrequited: true
				}
			});
		},
		{
			suspense: true,
			fallbackData: {
				count: {},
				items: []
			}
		}
	);

	if (!session) return null;
	const { user } = session;

	return (
		<ButtonLink
			className="w-full"
			href={user.subscription?.active ? urls.likes : urls.subscription}
			size="sm"
		>
			See who likes you{" "}
			{user.createdAt && new Date(user.createdAt) > new Date("2023-06-06") && (
				<span className="whitespace-nowrap">
					{likes.count.love && (
						<>
							({likes.count.love > 99 ? "99+" : likes.count.love}
							<HeartIcon className="inline h-4" gradient={false} />)
						</>
					)}{" "}
					{likes.count.friend && (
						<>
							({likes.count.friend > 99 ? "99+" : likes.count.friend}
							<PeaceIcon className="inline h-4" gradient={false} />)
						</>
					)}
				</span>
			)}
		</ButtonLink>
	);
};
