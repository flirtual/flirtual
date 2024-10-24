import { unstable_serialize } from "swr";
import { unstable_serialize as unstable_serialize_infinite } from "swr/infinite";

import { fromEntries } from "~/utilities";
import { SWRConfig } from "~/components/swr";
import { getConversationsKey } from "~/hooks/use-conversations.shared";
import { Conversation } from "~/api/conversations";
import { User } from "~/api/user";
import { Matchmaking } from "~/api/matchmaking";
import { ButtonLink } from "~/components/button";
import { urls } from "~/urls";
import { ModelCard } from "~/components/model-card";
import { userKey } from "~/swr";

import type { PropsWithChildren } from "react";

export default async function ConversationsLayout({
	children
}: PropsWithChildren) {
	const [{ data: conversations, metadata }, likes] = await Promise.all([
		Conversation.list(),
		Matchmaking.listMatches(true)
	]);

	if (conversations.length === 0)
		return (
			<ModelCard
				branded
				containerProps={{ className: "flex flex-col gap-4" }}
				title="You're new"
			>
				<p>You haven&apos;t matched with anyone yet.</p>
				<p>
					We prioritize showing you people that have liked or homied you, and
					showing your profile to people you have liked or homied, so you can
					match.
				</p>
				<p>Until then, you can always:</p>
				<ButtonLink href={urls.browse()} size="sm">
					Browse profiles
				</ButtonLink>
			</ModelCard>
		);

	const users = (
		await User.getMany(conversations.map(({ userId }) => userId))
	).filter(Boolean);

	return (
		<SWRConfig
			value={{
				fallback: {
					...fromEntries(
						users.map((user) => [unstable_serialize(userKey(user.id)), user])
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
