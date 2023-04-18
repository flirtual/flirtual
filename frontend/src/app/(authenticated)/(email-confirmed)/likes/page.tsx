import Link from "next/link";

import { api } from "~/api";
import { User, displayName } from "~/api/user";
import { ButtonLink } from "~/components/button";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { GenderPills } from "~/components/profile/pill/genders";
import { CountryPill } from "~/components/profile/pill/country";
import { UserAvatar } from "~/components/user-avatar";
import { thruServerCookies } from "~/server-utilities";
import { urls } from "~/urls";
import { filterBy } from "~/utilities";
import { Pill } from "~/components/profile/pill/pill";
import { LikeAndPassItem } from "~/api/matchmaking";
import { yearsAgo } from "~/date";

export default async function LikesPage() {
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
							{items.map((like) => (
								<Link href={urls.user.profile(like.user.username)} key={like.id}>
									<div className="flex items-center gap-4 rounded-xl bg-white-10 p-4 shadow-brand-1 dark:bg-black-80">
										<UserAvatar className="h-16" user={like.user} />
										<div className="flex grow flex-col">
											<h1 className="text-2xl font-semibold">{displayName(like.user)}</h1>
											<div className="flex gap-2">
												{like.user.bornAt && (
													<Pill small={true}>{yearsAgo(new Date(like.user.bornAt))}</Pill>
												)}
												<GenderPills
													simple
													attributes={filterBy(like.user.profile.attributes, "type", "gender")}
												/>
												{like.user.profile.country && (
													<CountryPill code={like.user.profile.country} flagOnly={true} />
												)}
											</div>
										</div>
										<p>{like.kind === "love" ? "❤️" : "✌️"}</p>
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
