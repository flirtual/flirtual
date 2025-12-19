import { useState } from "react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import type { LikesYouFilters } from "~/api/matchmaking";
import { ButtonLink } from "~/components/button";
import { ModelCard } from "~/components/model-card";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/page";
import { LikesFilters } from "./filters";
import { LikesList } from "./list";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{
			title: t("page_title", { name: t("likes_you") })
		}
	]);
};

export default function LikesPage() {
	const { t } = useTranslation();
	const [filters, setFilters] = useState<LikesYouFilters>({});

	return (
		<ModelCard
			className="desktop:max-w-3xl"
			containerProps={{ className: "p-0 desktop:px-16 desktop:py-10" }}
			title={t("likes_you")}
		>
			<div className="flex flex-col gap-8 py-8 desktop:py-0">
				<div className="flex flex-col gap-2 px-4 desktop:flex-row desktop:items-center desktop:p-0">
					<ButtonLink
						className="w-fit"
						href={urls.conversations.list()}
						size="sm"
					>
						{t("matches")}
					</ButtonLink>
					<div className="hidden flex-grow desktop:block" />
					<LikesFilters
						gender={filters.gender}
						kind={filters.kind}
						onGenderChange={(gender) => setFilters((f) => ({ ...f, gender }))}
						onKindChange={(kind) => setFilters((f) => ({ ...f, kind }))}
					/>
				</div>
				<LikesList filters={filters} />
			</div>
		</ModelCard>
	);
}
