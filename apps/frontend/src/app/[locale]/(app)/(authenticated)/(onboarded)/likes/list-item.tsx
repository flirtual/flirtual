import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { withSuspense } from "with-suspense";

import type { LikeAndPassItem, LikesYouFilters } from "~/api/matchmaking";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { CountryPill } from "~/components/profile/pill/country";
import { GenderPills } from "~/components/profile/pill/genders";
import { Pill } from "~/components/profile/pill/pill";
import { UserAvatar } from "~/components/user-avatar";
import { yearsAgo } from "~/date";
import { useUser } from "~/hooks/use-user";
import { useNavigate } from "~/i18n";
import { urls } from "~/urls";

export interface LikeListItemProps extends LikeAndPassItem {
	filters?: LikesYouFilters;
}

export const LikeListItem: FC<LikeListItemProps> = withSuspense(({ kind, profileId: userId, filters }) => {
	const user = useUser(userId);
	const { t } = useTranslation();
	const navigate = useNavigate();

	if (!user) return null;

	const Icon = kind === "love" ? HeartIcon : PeaceIcon;

	return (
		<button
			className="relative w-full text-left desktop:rounded-xl desktop:shadow-brand-1"
			type="button"
			onClick={() => navigate(urls.likesBrowse, {
				state: { filters, initialUserId: user.id }
			})}
		>
			<div className="flex items-center bg-white-30 vision:bg-white-10/50 dark:bg-black-60 desktop:rounded-xl">
				<UserAvatar
					className="my-2 ml-2 mr-0 size-[4.5rem] shrink-0 rounded-lg desktop:m-0 desktop:size-20 desktop:rounded-none desktop:rounded-l-xl"
					height={80}
					user={user}
					variant="thumb"
					width={80}
				/>
				<div className="flex w-1 grow flex-col justify-center gap-1 px-4">
					<span data-mask className="truncate font-montserrat text-lg font-semibold leading-tight">
						{user.profile.displayName || t("unnamed_user")}
					</span>
					<div className="flex items-center justify-between gap-4">
						<div className="flex flex-wrap gap-2">
							{user.bornAt && (
								<Pill small className="h-8 bg-white-20 vision:bg-white-30/70 dark:bg-black-40">
									{yearsAgo(new Date(user.bornAt))}
								</Pill>
							)}
							<GenderPills
								simple
								small
								attributes={user.profile.attributes.gender || []}
								className="h-8 bg-white-20 vision:bg-white-30/70 dark:bg-black-40"
							/>
							{user.profile.country && (
								<CountryPill id={user.profile.country} flagOnly className="bg-white-20 dark:bg-black-40" />
							)}
						</div>
					</div>
				</div>
				<Icon className="ml-4 mr-6 inline h-7 shrink-0" />
			</div>
		</button>
	);
}, {
	fallback: (
		<div className="relative rounded-xl shadow-brand-1">
			<div className="flex rounded-xl bg-white-30 vision:bg-white-10/50 dark:bg-black-60">
				<div className="size-20 shrink-0 animate-pulse rounded-l-xl bg-white-20 vision:bg-white-20/50 dark:bg-black-50" />
				<div className="flex w-1 grow flex-col gap-1 p-4">
					<div className="flex justify-between gap-4">
						<span className="h-5 w-1/2 animate-pulse rounded bg-white-20 vision:bg-white-20/50 dark:bg-black-50" />
						<span className="size-5 animate-pulse rounded bg-white-20 vision:bg-white-20/50 dark:bg-black-50" />
					</div>
					<div className="flex items-baseline justify-between gap-4">
						<span className="h-5 w-full animate-pulse rounded bg-white-20 vision:bg-white-20/50 dark:bg-black-50" />
					</div>
				</div>
			</div>
		</div>
	)
});
