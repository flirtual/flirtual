import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { withSuspense } from "with-suspense";

import type { LikeAndPassItem } from "~/api/matchmaking";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { Link } from "~/components/link";
import { CountryPill } from "~/components/profile/pill/country";
import { GenderPills } from "~/components/profile/pill/genders";
import { Pill } from "~/components/profile/pill/pill";
import { UserAvatar } from "~/components/user-avatar";
import { yearsAgo } from "~/date";
import { useUser } from "~/hooks/use-user";
import { urls } from "~/urls";

export const LikeListItem: FC<LikeAndPassItem> = withSuspense(({ kind, profileId: userId }) => {
	const user = useUser(userId);
	const { t } = useTranslation();

	if (!user) return null;

	const Icon = kind === "love" ? HeartIcon : PeaceIcon;

	return (
		<Link key={user.id} className="flex items-center gap-4 bg-white-10 p-4 vision:bg-white-10/10 dark:bg-black-80 desktop:rounded-xl desktop:shadow-brand-1" href={urls.profile(user)}>
			<UserAvatar
				className="aspect-square h-16 rounded-lg"
				height={64}
				user={user}
				variant="thumb"
				width={64}
			/>
			<div className="flex w-full grow flex-col">
				<h1 data-mask className="text-xl font-semibold desktop:text-2xl">
					{user.profile.displayName || t("unnamed_user")}
				</h1>
				<div className="flex w-full gap-2">
					{user.bornAt && (
						<Pill small className="vision:bg-white-30/70">
							{yearsAgo(new Date(user.bornAt))}
						</Pill>
					)}
					<GenderPills
						simple
						small
						attributes={user.profile.attributes.gender || []}
						className="vision:bg-white-30/70"
					/>
					{user.profile.country && (
						<CountryPill id={user.profile.country} flagOnly />
					)}
				</div>
			</div>
			<Icon className="h-8 shrink-0 pr-4 desktop:mr-2" />
		</Link>
	);
}, {
	fallback: (
		<div className="flex items-center gap-4 bg-white-10 p-4 vision:bg-white-10/10 dark:bg-black-80 desktop:rounded-xl desktop:shadow-brand-1">
			<div className="size-16 shrink-0 animate-pulse rounded-lg bg-black-90/10 bg-brand-gradient dark:bg-white-10/20" />
			<div className="flex w-full grow flex-col gap-2">
				<span className="h-6 w-32 animate-pulse rounded-xl bg-black-90/10 text-xl font-semibold dark:bg-white-10/20 desktop:text-2xl" />
				<div className="flex w-full gap-2">
					<div className="h-8 w-10 animate-pulse rounded-xl bg-black-80/10 dark:bg-white-10/10" />
					<div className="h-8 w-20 animate-pulse rounded-xl bg-black-80/10 dark:bg-white-10/10" />
					<div className="h-8 w-11 animate-pulse rounded-xl bg-black-80/10 dark:bg-white-10/10" />
				</div>
			</div>
			<div className="size-10 shrink-0 animate-pulse rounded-3xl bg-black-90/10 pr-4 dark:bg-white-10/20 desktop:mr-5" />
		</div>
	)
});
