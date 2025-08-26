import type { PropsWithChildren } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { useConversations } from "~/hooks/use-conversations";

import type { Locale } from "~/i18n";
import { LikesYouButton } from "./likes-you-button";
import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

export default function ConversationsLayout() {
	const { t } = useTranslation();

	const { data: [firstPage], loadMore } = useConversations();
	const { data: conversations } = firstPage || { data: [] };

	if (conversations.length === 0)
		return <ModelCard
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
									i18nKey="heavy_weak_hare_spin"
									components={{
										link: <InlineLink href={urls.socials.discord} />
									}}
								/>
							</details>
							<div className="flex flex-col gap-2">
								<LikesYouButton />
								<ButtonLink href={urls.discover("dates")} kind="tertiary" size="sm">{t("browse_profiles")}</ButtonLink>
							</div>
						</ModelCard>

	return <>
	<button type="button" onClick={loadMore}>more</button>
		<Outlet />
	</>
}
