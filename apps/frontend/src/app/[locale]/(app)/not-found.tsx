"use client";

import { useTranslations } from "next-intl";

import { ButtonLink } from "~/components/button";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

export default function NotFoundPage() {
	const t = useTranslations();

	return (
		<ModelCard
			branded
			className="desktop:max-w-xl"
			containerProps={{ className: "flex gap-4" }}
		>
			<span className="desktop:text-lg">
				{t("round_crazy_haddock_mix")}
			</span>
			<div className="flex gap-2">
				<ButtonLink href={urls.discover("love")} size="sm">
					{t("back_to_browsing")}
				</ButtonLink>
			</div>
		</ModelCard>
	);
}
