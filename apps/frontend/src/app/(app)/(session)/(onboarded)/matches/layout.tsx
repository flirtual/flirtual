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
import { userKey } from "~/hooks/use-user";

import { ConversationListItem } from "./list-item";

import type { PropsWithChildren } from "react";

const exampleDate = new Date("September 10 2024");

export default async function ConversationsLayout({
	children
}: PropsWithChildren) {
	const [{ data: conversations, metadata }, likes] = await Promise.all([
		Conversation.list(),
		Matchmaking.listMatches(true)
	]);

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
			{conversations.length !== 0 ? (
				children
			) : (
				<ModelCard
					containerProps={{ className: "flex flex-col gap-2" }}
					title="Matches"
				>
					<p className="font-bold">
						Matches will appear here once you&apos;ve made some.
					</p>
					<p>
						When you and another person both like or “homie” each other
						(it&apos;s mutual), you&apos;ll get matched! Once matched, you can
						start messaging each other on Flirtual and plan to meet up in VR.
					</p>
					<span>Here&apos;s what one would look like:</span>
					<ConversationListItem
						example
						isUnread
						createdAt={exampleDate.toISOString()}
						id=""
						kind="love"
						userId=""
						userOverride={{
							slug: "val",
							profile: {
								displayName: "Val (example)",
								images: [
									{
										createdAt: exampleDate.toISOString(),
										id: "",
										updatedAt: exampleDate.toISOString(),
										externalId: "d795c89b-8c22-4c0e-ac4c-af6aa2ba4c6b"
									}
								]
							}
						}}
					/>
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
			)}
		</SWRConfig>
	);
}
