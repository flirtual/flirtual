import { getTranslations } from "next-intl/server";
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
	const t = await getTranslations();

	const [{ data: conversations, metadata }, likes] = await Promise.all([
		Conversation.list(),
		Matchmaking.likesYou()
	]);

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
			{conversations.length === 0
				? (
						<ModelCard
							branded
							containerProps={{ className: "flex flex-col gap-4" }}
							title={t("matches")}
						>
							<h1 className="text-2xl font-semibold">{t("just_loud_orangutan_dash")}</h1>
							<p>{t("born_green_lion_tend")}</p>
							<p>{t("antsy_great_spider_drum")}</p>
							<details>
								<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
									{t("tips")}
								</summary>
								{t.rich("heavy_weak_hare_spin", {
									link: (children) => (
										<InlineLink href={urls.socials.discord}>{children}</InlineLink>
									)
								})}
							</details>
							<div className="flex flex-col gap-2">
								<LikesYouButton />
								<ButtonLink href={urls.browse()} kind="tertiary" size="sm">{t("browse_profiles")}</ButtonLink>
							</div>
						</ModelCard>
					)
				: children}
		</SWRConfig>
	);
}
