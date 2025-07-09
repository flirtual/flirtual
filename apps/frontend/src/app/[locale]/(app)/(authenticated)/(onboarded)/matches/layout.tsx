import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { type PropsWithChildren, use } from "react";

import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

import { LikesYouButton } from "./likes-you-button";

export default function ConversationsLayout({
	params,
	children
}: PropsWithChildren<{ params: Promise<{ locale: Locale }> }>) {
	const { locale } = use(params);
	setRequestLocale(locale);

	// const { data: conversations } = useConversations();
	const t = useTranslations();

	// TODO:
	return children;

	return (
		<>
			{conversations.length === 0
				? (
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
								{t.rich("heavy_weak_hare_spin", {
									link: (children) => (
										<InlineLink href={urls.socials.discord}>{children}</InlineLink>
									)
								})}
							</details>
							<div className="flex flex-col gap-2">
								<LikesYouButton />
								<ButtonLink href={urls.discover("dates")} kind="tertiary" size="sm">{t("browse_profiles")}</ButtonLink>
							</div>
						</ModelCard>
					)
				: children}
		</>
	);
}
