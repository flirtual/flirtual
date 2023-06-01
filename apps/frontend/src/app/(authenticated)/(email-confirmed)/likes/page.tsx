import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";

import { api } from "~/api";
import { User, displayName } from "~/api/user";
import { ButtonLink } from "~/components/button";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { GenderPills } from "~/components/profile/pill/genders";
import { CountryPill } from "~/components/profile/pill/country";
import { UserAvatar } from "~/components/user-avatar";
import { thruServerCookies, withSession } from "~/server-utilities";
import { urls } from "~/urls";
import { filterBy } from "~/utilities";
import { Pill } from "~/components/profile/pill/pill";
import { LikeAndPassItem } from "~/api/matchmaking";
import { yearsAgo } from "~/date";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";

export const metadata: Metadata = {
	title: "Liked me"
};

export default async function LikesPage() {
	const { user } = await withSession();

	if (!user.subscription?.active) redirect(urls.subscription);

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
				className="sm:max-w-3xl"
				containerProps={{ className: "p-0 sm:px-16 sm:py-10" }}
				title="Likes You"
			>
				<div className="flex flex-col gap-8 py-8 sm:py-0">
					<div className="px-4 sm:p-0">
						<ButtonLink className="w-fit" href={urls.conversations.list()} size="sm">
							Matches
						</ButtonLink>
					</div>
					{items.length === 0 ? (
						<div className="flex flex-col gap-1 px-4 sm:px-0">
							<span className="text-xl font-semibold">No one has liked you yet 😔</span>
							<span>But it&apos;s only a matter of time.</span>
						</div>
					) : (
						<div className="flex flex-col gap-2 sm:gap-4">
							{items.map(({ id, user, kind }) => {
								const Icon = kind === "love" ? HeartIcon : PeaceIcon;
								return (
									<Link href={urls.user.profile(user.username)} key={id}>
										<div className="flex items-center gap-4 bg-white-10 p-4 dark:bg-black-80 sm:rounded-xl sm:shadow-brand-1">
											<UserAvatar
												className="aspect-square h-16 rounded-lg"
												height={64}
												user={user}
												width={64}
											/>
											<div className="flex w-full grow flex-col">
												<h1 className="text-xl font-semibold sm:text-2xl">{displayName(user)}</h1>
												<div className="flex w-full gap-2">
													{user.bornAt && <Pill small>{yearsAgo(new Date(user.bornAt))}</Pill>}
													<GenderPills
														simple
														small
														attributes={filterBy(user.profile.attributes, "type", "gender")}
													/>
													{user.profile.country && (
														<CountryPill flagOnly code={user.profile.country} />
													)}
												</div>
											</div>
											<Icon className="h-8 shrink-0 pr-4 sm:mr-2" />
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
