import Link from "next/link";
import { redirect } from "next/navigation";

import { api } from "~/api";
import { type User, displayName } from "~/api/user";
import { ButtonLink } from "~/components/button";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { GenderPills } from "~/components/profile/pill/genders";
import { CountryPill } from "~/components/profile/pill/country";
import { UserAvatar } from "~/components/user-avatar";
import { thruServerCookies, getSession } from "~/server-utilities";
import { urls } from "~/urls";
import { filterBy } from "~/utilities";
import { Pill } from "~/components/profile/pill/pill";
import { yearsAgo } from "~/date";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";

import type { LikeAndPassItem } from "~/api/matchmaking";
import type { Metadata } from "next";

export const maxDuration = 120;

export const metadata: Metadata = {
	title: "Likes you"
};

export default async function LikesPage() {
	const { user } = await getSession();

	if (!user.subscription?.active) redirect(urls.subscription.default);

	const result = await api.matchmaking.listMatches({
		...thruServerCookies(),
		query: { unrequited: true }
	});

	const users = await api.user.bulk({
		...thruServerCookies(),
		body: result.items.map((item) => item.profileId)
	});

	const items = result.items
		.map((item) => ({
			...item,
			user: users.find((user) => user?.id === item.profileId)
		}))
		.filter(({ user }) => !!user) as Array<LikeAndPassItem & { user: User }>;

	return (
		<SoleModelLayout footer={{ desktopOnly: true }}>
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
														className="vision:bg-white-30/70"
														attributes={filterBy(
															user.profile.attributes,
															"type",
															"gender"
														)}
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
		</SoleModelLayout>
	);
}
