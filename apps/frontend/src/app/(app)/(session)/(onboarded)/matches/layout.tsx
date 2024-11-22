import type { PropsWithChildren } from "react";
import { fromEntries } from "remeda";
import { unstable_serialize } from "swr";
import { unstable_serialize as unstable_serialize_infinite } from "swr/infinite";

import { Conversation } from "~/api/conversations";
import { Matchmaking } from "~/api/matchmaking";
import { User } from "~/api/user";
import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { getConversationsKey } from "~/hooks/use-conversations.shared";
import { userKey } from "~/swr";
import { urls } from "~/urls";

import { LikesYouButton } from "./likes-you-button";

export default async function ConversationsLayout({
	children
}: PropsWithChildren) {
	const [{ data: conversations, metadata }, likes] = await Promise.all([
		Conversation.list(),
		Matchmaking.likesYou()
	]);

	if (conversations.length === 0)
		return (
			<ModelCard
				branded
				containerProps={{ className: "flex flex-col gap-4" }}
				title="Matches"
			>
				<h1 className="text-2xl font-semibold">
					You'll find your matches here
				</h1>
				<p>
					When someone likes or homies you back, it&apos;s a match! You&apos;ll be able to message them and meet up in VR.
				</p>
				<p>
					We prioritize showing you people who like or homie you, so you can match.
				</p>
				<details>
					<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
						Tips
					</summary>
					We&apos;ll show your profile to more people when you use Flirtual actively, like/homie people, and complete your profile details.
					{" "}
					<InlineLink href={urls.socials.discord}>Join our Discord</InlineLink>
					{" "}
					to share your profile and get feedback!
				</details>
				<div className="flex flex-col gap-2">
					<ButtonLink href={urls.browse()} size="sm">Browse profiles</ButtonLink>
					<LikesYouButton />
				</div>
			</ModelCard>
		);

	const userIds = conversations.map(({ userId }) => userId);
	const userById = fromEntries((await User.getMany(userIds)).filter(Boolean).map((user) => [user.id, user]));

	return (
		<SWRConfig
			value={{
				fallback: {
					...fromEntries(
						userIds.map((userId) => [unstable_serialize(userKey(userId)), userById[userId] || null])
					),
					[unstable_serialize("likes")]: likes,
					[unstable_serialize_infinite(getConversationsKey)]: [
						{ data: conversations, metadata }
					]
				}
			}}
		>
			{children}
		</SWRConfig>
	);
}
