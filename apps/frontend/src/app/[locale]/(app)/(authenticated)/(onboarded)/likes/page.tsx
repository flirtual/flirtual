import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { ButtonLink } from "~/components/button";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

import { LikesList } from "./list";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("likes_you")
	};
}

export default function LikesPage({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = use(params);
	setRequestLocale(locale);

	const t = useTranslations();

	return (
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
	);
}
