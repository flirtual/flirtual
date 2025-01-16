import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { Authentication } from "~/api/auth";
import { Matchmaking } from "~/api/matchmaking";
import { User } from "~/api/user";
import { ButtonLink } from "~/components/button";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { attributeKey, likesYouKey, userKey } from "~/swr";
import { urls } from "~/urls";

import { LikesList } from "./list";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("likes_you")
	};
}

export default async function LikesPage() {
	const t = await getTranslations();
	const { user } = await Authentication.getSession();

	if (!user.subscription?.active) redirect(urls.subscription.default);

	const [data, genders, countries] = await Promise.all([
		Matchmaking.likesYou(),
		Attribute.list("gender"),
		Attribute.list("country")
	]);

	const users = await Promise.all(data.items.map((item) => User.get(item.profileId)));

	return (
		<SWRConfig value={{
			fallback: {
				[unstable_serialize(likesYouKey())]: data,
				[unstable_serialize(attributeKey("gender"))]: genders,
				[unstable_serialize(attributeKey("country"))]: countries,
				...Object.fromEntries(users.filter(Boolean).map((user) => [unstable_serialize(userKey(user.id)), user]))
			}
		}}
		>
			<ModelCard
				className="desktop:max-w-3xl"
				containerProps={{ className: "p-0 desktop:px-16 desktop:py-10" }}
				title={t("likes_you")}
			>
				<div className="flex flex-col gap-8 py-8 desktop:py-0">
					<div className="px-4 desktop:p-0">
						<ButtonLink
							className="w-fit"
							href={urls.conversations.list()}
							size="sm"
						>
							{t("matches")}
						</ButtonLink>
					</div>
					<LikesList />
				</div>
			</ModelCard>
		</SWRConfig>
	);
}
