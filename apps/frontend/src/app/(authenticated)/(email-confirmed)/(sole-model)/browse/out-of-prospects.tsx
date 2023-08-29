import { ProspectKind } from "~/api/matchmaking";
import { User } from "~/api/user";
import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

import { Countdown } from "./countdown";

export interface OutOfProspectsProps {
	user: User;
	mode: ProspectKind;
}

export const OutOfProspects: React.FC<OutOfProspectsProps> = ({
	user,
	mode
}) => {
	return (
		<ModelCard
			title="Come back tomorrow!"
			titleProps={{ className: "md:text-3xl" }}
		>
			<div className="flex flex-col gap-8">
				{mode === "love" ? (
					// TODO: Actually check if we are out of profiles, not just Premium
					user.subscription?.active ? (
						<>
							<div className="flex flex-col gap-4">
								<p>You have run out of profiles :(</p>
								<p>
									To see more people, try expanding your{" "}
									<InlineLink href={urls.settings.matchmaking()}>
										matchmaking filters
									</InlineLink>
									.
								</p>
								<p>
									Or check back later. Each week hundreds of new Flirtual
									profiles are created. Invite your friends to try Flirtual!
								</p>
								<p>
									You can also continue in{" "}
									<InlineLink href={urls.browse("friend")}>
										Homie Mode
									</InlineLink>
									, where you can meet new friends (without matchmaking
									filters).
								</p>
							</div>
							<div className="flex gap-4">
								<ButtonLink href={urls.settings.matchmaking()} size="sm">
									Filters
								</ButtonLink>
								<ButtonLink href={urls.browse("friend")} size="sm">
									Homie Mode
								</ButtonLink>
							</div>
						</>
					) : (
						<>
							<div className="flex flex-col gap-4">
								<p>You are out of profiles for today :(</p>
								<p>
									You can{" "}
									<InlineLink href={urls.subscription.default.default}>
										upgrade to Premium
									</InlineLink>{" "}
									to <em>browse unlimited profiles</em> and{" "}
									<em>see who&apos;s already liked you</em>.
								</p>
								<p>
									You can also continue in{" "}
									<InlineLink href={urls.browse("friend")}>
										Homie Mode
									</InlineLink>
									, where you can meet new friends (without matchmaking
									filters).
								</p>
								{user.profile.resetLoveAt && (
									<p className="font-semibold">
										New profiles in{" "}
										<Countdown date={user.profile.resetLoveAt} />
									</p>
								)}
							</div>
							<div className="flex gap-4">
								<ButtonLink href={urls.subscription.default} size="sm">
									Premium
								</ButtonLink>
								<ButtonLink href={urls.browse("friend")} size="sm">
									Homie Mode
								</ButtonLink>
							</div>
						</>
					)
				) : user.subscription?.active ? (
					<>
						<div className="flex flex-col gap-4">
							<p>You have run out of homies :(</p>
							<p>
								Come back later! Each week hundreds of new Flirtual profiles are
								created. Invite your friends to try Flirtual!
							</p>
						</div>
						<div className="flex gap-4">
							<ButtonLink href={urls.browse()} size="sm">
								Leave Homie Mode
							</ButtonLink>
						</div>
					</>
				) : (
					<>
						<div className="flex flex-col gap-4">
							<p>You are out of homies for today :(</p>
							<p>
								You can{" "}
								<InlineLink href={urls.subscription.default}>
									upgrade to Premium
								</InlineLink>{" "}
								to <em>browse unlimited profiles</em> and{" "}
								<em>see who&apos;s already liked you</em>.
							</p>
							{user.profile.resetFriendAt && (
								<p className="font-semibold">
									New profiles in{" "}
									<Countdown date={user.profile.resetFriendAt} />
								</p>
							)}
						</div>
						<div className="flex gap-4">
							<ButtonLink href={urls.subscription.default} size="sm">
								Premium
							</ButtonLink>
							<ButtonLink href={urls.browse()} size="sm">
								Leave Homie Mode
							</ButtonLink>
						</div>
					</>
				)}
			</div>
		</ModelCard>
	);
};
