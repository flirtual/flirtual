import Link from "next/link";
import { redirect } from "next/navigation";

import { User, displayName } from "~/api/user";
import { ButtonLink } from "~/components/button";
import { ModelCard } from "~/components/model-card";
import { GenderPills } from "~/components/profile/pill/genders";
import { CountryPill } from "~/components/profile/pill/country";
import { UserAvatar } from "~/components/user-avatar";
import { urls } from "~/urls";
import { Pill } from "~/components/profile/pill/pill";
import { yearsAgo } from "~/date";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { Matchmaking, type LikeAndPassItem } from "~/api/matchmaking";
import { Authentication } from "~/api/auth";

import type { Metadata } from "next";

export const maxDuration = 120;

export const metadata: Metadata = {
	title: "Likes you"
};

export default async function LikesPage() {
	const { user } = await Authentication.getSession();

	if (!user.subscription?.active) redirect(urls.subscription.default);

	const result = await Matchmaking.listMatches(true);
	const users = await User.getMany(result.items.map((item) => item.profileId));

	const items = result.items
		.map((item) => ({
			...item,
			user: users.find((user) => user?.id === item.profileId)
		}))
		.filter(({ user }) => !!user) as Array<LikeAndPassItem & { user: User }>;

	return (
		<ModelCard
			className="desktop:max-w-3xl"
			containerProps={{ className: "p-0 desktop:px-16 desktop:py-10" }}
			title="Likes you"
		>
			<div className="flex flex-col gap-8 py-8 desktop:py-0">
				<div className="px-4 desktop:p-0">
					<ButtonLink
						className="w-fit"
						href={urls.conversations.list()}
						size="sm"
					>
						Matches
					</ButtonLink>
				</div>
				{items.length === 0 ? (
					<div className="flex flex-col gap-1 px-4 desktop:px-0">
						<span className="text-xl font-semibold">
							No one has liked you yet 😔
						</span>
						<span>But it&apos;s only a matter of time.</span>
					</div>
				) : (
					<div className="flex flex-col gap-2 desktop:gap-4">
						{items.map(({ id, user, kind }) => {
							const Icon = kind === "love" ? HeartIcon : PeaceIcon;
							return (
								<Link href={urls.profile(user)} key={id}>
									<div className="flex items-center gap-4 bg-white-10 p-4 vision:bg-white-10/10 dark:bg-black-80 desktop:rounded-xl desktop:shadow-brand-1">
										<UserAvatar
											className="aspect-square h-16 rounded-lg"
											height={64}
											user={user}
											variant="thumb"
											width={64}
										/>
										<div className="flex w-full grow flex-col">
											<h1 className="text-xl font-semibold desktop:text-2xl">
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
									</div>
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</ModelCard>
	);
}
