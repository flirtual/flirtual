import Link from "next/link";
import { redirect } from "next/navigation";

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
			<ModelCard className="sm:max-w-3xl" title="Likes You">
				<div className="flex flex-col gap-8">
					<ButtonLink className="w-fit" href={urls.conversations.list} size="sm">
						Matches
					</ButtonLink>
					{items.length === 0 ? (
						<div className="flex flex-col gap-1">
							<span className="text-xl font-semibold">No one has liked you yet 😔</span>
							<span>But it&apos;s only a matter of time.</span>
						</div>
					) : (
						<div className="flex flex-col gap-4">
							{items.map(({ id, user, kind }) => {
								const Icon = kind === "love" ? HeartIcon : PeaceIcon;
								return (
									<Link href={urls.user.profile(user.username)} key={id}>
										<div className="flex items-center gap-4 rounded-xl bg-white-10 p-4 shadow-brand-1 dark:bg-black-80">
											<UserAvatar className="h-16 rounded-xl" height={64} user={user} width={64} />
											<div className="flex grow flex-col">
												<h1 className="text-2xl font-semibold">{displayName(user)}</h1>
												<div className="flex gap-2">
													{user.bornAt && (
														<Pill small={true}>{yearsAgo(new Date(user.bornAt))}</Pill>
													)}
													{/* @ts-expect-error: Server Component */}
													<GenderPills
														simple
														attributes={filterBy(user.profile.attributes, "type", "gender")}
													/>
													{user.profile.country && (
														/* @ts-expect-error: Server Component */
														<CountryPill code={user.profile.country} flagOnly={true} />
													)}
												</div>
											</div>
											<Icon className="h-8 pr-4" />
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
