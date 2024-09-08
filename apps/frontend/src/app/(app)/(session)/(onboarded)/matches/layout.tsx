import * as swrInfinite from "swr/infinite";
import * as swr from "swr";

import { fromEntries } from "~/utilities";
import { SWRConfig } from "~/components/swr";
import { getConversationsKey } from "~/hooks/use-conversations.shared";
import { ModelCard } from "~/components/model-card";
import { ButtonLink } from "~/components/button";
import { urls } from "~/urls";
import { Conversation } from "~/api/conversations";
import { User } from "~/api/user";

import { LikesYouButton } from "./likes-you-button";

import type { PropsWithChildren } from "react";

export default async function ConversationsLayout({
	children
}: PropsWithChildren) {
	const { data: conversations, metadata } = await Conversation.list();
	const users = await User.getMany(conversations.map(({ userId }) => userId));

	return (
		<SWRConfig
			value={{
				fallback: {
					...fromEntries(
						users.map((user) => [
							swr.unstable_serialize(["user", user.id]),
							user
						])
					),
					[swrInfinite.unstable_serialize(getConversationsKey)]: [
						{ data: conversations, metadata }
					]
				}
			}}
		>
			{conversations.length === 0 ? (
				<ModelCard
					className="desktop:max-w-xl"
					containerProps={{ className: "gap-4" }}
					title="No matches"
				>
					<h1 className="text-2xl font-semibold">
						You haven&apos;t matched with anyone yet
					</h1>
					<p>
						If you and someone else both like or homie each other (it&apos;s
						mutual), then you will match! After you match, you can message each
						other on Flirtual and meet up in VR.
					</p>
					<p>
						We prioritize showing you people that have liked or homied you, and
						showing your profile to people you have liked or homied, so you can
						match.
					</p>
					<div className="flex flex-col gap-2">
						<ButtonLink href={urls.browse()}>Browse</ButtonLink>
						<LikesYouButton />
					</div>
				</ModelCard>
			) : (
				children
			)}
		</SWRConfig>
	);
}
