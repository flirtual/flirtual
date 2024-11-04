import Link from "next/link";
import type { FC } from "react";

import type { LikeAndPassItem } from "~/api/matchmaking";
import { displayName } from "~/api/user";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { CountryPill } from "~/components/profile/pill/country";
import { GenderPills } from "~/components/profile/pill/genders";
import { Pill } from "~/components/profile/pill/pill";
import { UserAvatar } from "~/components/user-avatar";
import { yearsAgo } from "~/date";
import { useUser } from "~/hooks/use-user";
import { urls } from "~/urls";

export const LikeListItem: FC<LikeAndPassItem> = ({ kind, profileId: userId }) => {
	const user = useUser(userId);
	if (!user) return null;

	const Icon = kind === "love" ? HeartIcon : PeaceIcon;

	return (
		<Link className="flex items-center gap-4 bg-white-10 p-4 vision:bg-white-10/10 dark:bg-black-80 desktop:rounded-xl desktop:shadow-brand-1" href={urls.profile(user)} key={user.id}>
			<UserAvatar
				className="aspect-square h-16 rounded-lg"
				height={64}
				user={user}
				variant="thumb"
				width={64}
			/>
			<div className="flex w-full grow flex-col">
				<h1 data-mask className="text-xl font-semibold desktop:text-2xl">
					{displayName(user)}
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
						<CountryPill flagOnly id={user.profile.country} />
					)}
				</div>
			</div>
			<Icon className="h-8 shrink-0 pr-4 desktop:mr-2" />
		</Link>
	);
};
