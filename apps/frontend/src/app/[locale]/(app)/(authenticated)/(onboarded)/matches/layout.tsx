import { Trans, useTranslation } from "react-i18next";
import { Outlet } from "react-router";

import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { preloadConversations, useConversations } from "~/hooks/use-conversations";
import { preloadLikesYouPreview } from "~/hooks/use-likes-you";
import { urls } from "~/urls";

import { LikesYouButton } from "./likes-you-button";

export const handle = {
	preload: () => Promise.all([
		preloadConversations(),
		preloadLikesYouPreview()
	])
};

export const clientLoader = handle.preload;

export default function ConversationsLayout() {
	const { t } = useTranslation();

	const { data: [firstPage] } = useConversations();
	const { data: conversations } = firstPage || { data: [] };

	if (conversations.length === 0)
		return (
			<ModelCard
				branded
				containerProps={{ className: "flex flex-col gap-4" }}
				title={t("matches")}
			>
				<h1 className="text-2xl font-semibold">{t("just_loud_orangutan_dash")}</h1>
				<p>{t("antsy_great_spider_drum")}</p>
				<p>{t("born_green_lion_tend")}</p>
				<details>
					<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
						{t("tips")}
					</summary>
					<Trans
						components={{
							discordLink: <InlineLink href={urls.socials.discord} />
						}}
						i18nKey="heavy_weak_hare_spin"
					/>
				</details>
				<div className="flex flex-col gap-2">
					<LikesYouButton />
					<ButtonLink
						href={urls.discover("dates")}
						kind="tertiary"
						size="sm"
					>
						{t("browse_profiles")}
					</ButtonLink>
				</div>
			</ModelCard>
		);

	return <Outlet />;
}

export { Loading as HydrateFallback } from "~/components/loading";
