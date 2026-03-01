import { AnimatePresence, m } from "motion/react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import invariant from "tiny-invariant";

import type { LikesYouFilters, LikesYouGenderFilter, ProspectKind } from "~/api/matchmaking";
import {
	LikesYouGenderFilter as LikesYouGenderFilterValues,
	ProspectKind as ProspectKindValues
} from "~/api/matchmaking";
import { ButtonLink } from "~/components/button";
import { ModelCard } from "~/components/model-card";
import { preloadProfileAttributes, Profile } from "~/components/profile";
import { useLikesQueue } from "~/hooks/use-likes-queue";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/page";
import { LikesFilters } from "./filters";
import { LikesList } from "./list";
import { LikesQueueActions } from "./queue-actions";

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

export const handle = {
	preload: preloadProfileAttributes
};

export const clientLoader = handle.preload;

function parseFilters(searchParameters: URLSearchParams): { filters: LikesYouFilters; initialUserId?: string } {
	const filters: LikesYouFilters = {};

	const kind = searchParameters.get("kind");
	if (kind && (ProspectKindValues as ReadonlyArray<string>).includes(kind))
		filters.kind = kind as ProspectKind;

	const gender = searchParameters.get("gender");
	if (gender && (LikesYouGenderFilterValues as ReadonlyArray<string>).includes(gender))
		filters.gender = gender as LikesYouGenderFilter;

	return { filters, initialUserId: searchParameters.get("start") || undefined };
}

export default function LikesPage() {
	const { t } = useTranslation();
	const [searchParameters, setSearchParameters] = useSearchParams();
	const { filters, initialUserId } = parseFilters(searchParameters);

	const browsing = !!initialUserId;

	return browsing
		? <LikesBrowseView filters={filters} initialUserId={initialUserId} />
		: (
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
								onGenderChange={(gender) => setSearchParameters((previous) => {
									if (gender) previous.set("gender", gender);
									else previous.delete("gender");
									return previous;
								})}
								onKindChange={(kind) => setSearchParameters((previous) => {
									if (kind) previous.set("kind", kind);
									else previous.delete("kind");
									return previous;
								})}
							/>
						</div>
						<LikesList filters={filters} />
					</div>
				</ModelCard>
			);
}

function LikesBrowseView({ filters, initialUserId }: { filters: LikesYouFilters; initialUserId: string }) {
	const { current } = useLikesQueue("love", { filters, initialUserId });

	if (!current) return null;

	return (
		<>
			<div className="relative w-full max-w-full gap-4 desktop:w-auto">
				<AnimatePresence initial={false}>
					<m.div
						key={current}
						animate={{ opacity: 1 }}
						className="relative top-0 z-10"
						exit={{ opacity: 0, position: "absolute" }}
						initial={{ opacity: 0 }}
					>
						<Profile userId={current} />
					</m.div>
				</AnimatePresence>
			</div>

			<LikesQueueActions filters={filters} initialUserId={initialUserId} kind="love" />
		</>
	);
}
