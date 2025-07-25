import { useTranslation } from "react-i18next";

import { ButtonLink } from "~/components/button";
import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/root";
import { urls } from "~/urls";

import type { Route } from "./+types/page";
import { LikesList } from "./list";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{
			title: t("likes_you")
		}
	]);
};

export default function LikesPage() {
	const { t } = useTranslation();

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
