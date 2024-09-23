import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

import type { ProspectKind } from "~/api/matchmaking";
import type { FC } from "react";

export interface OutOfProspectsErrorProps {
	mode: ProspectKind;
}

export const OutOfProspectsError: FC<OutOfProspectsErrorProps> = ({ mode }) => {
	return (
		<ModelCard
			branded
			title="That's everyone!"
			titleProps={{ className: "desktop:text-3xl" }}
		>
			<div className="flex flex-col gap-8">
				{
					{
						love: (
							<>
								<div className="flex flex-col gap-4">
									<p>You've seen everyone that matches your preferences.</p>
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
						),
						friend: (
							<>
								<div className="flex flex-col gap-4">
									<p>You've seen everyone that matches your preferences.</p>
									<p>
										Come back later! Each week hundreds of new Flirtual profiles
										are created. Invite your friends to try Flirtual!
									</p>
								</div>
								<div className="flex gap-4">
									<ButtonLink href={urls.browse()} size="sm">
										Leave Homie Mode
									</ButtonLink>
								</div>
							</>
						)
					}[mode]
				}
			</div>
		</ModelCard>
	);
};

export const FinishProfileError: React.FC = () => {
	return (
		<ModelCard
			branded
			title="Complete your profile"
			titleProps={{ className: "desktop:text-3xl" }}
		>
			<div className="flex flex-col gap-4">
				<p>
					You've went through quite a few profiles already, let's finish setting
					up your account before you continue. We'll need you to finish your
					profile then you'll be back in the action.
				</p>
				<div className="flex gap-4">
					<ButtonLink href={urls.finish(1)} size="sm">
						Finish profile
					</ButtonLink>
				</div>
			</div>
		</ModelCard>
	);
};

export const ConfirmEmailError: React.FC = () => {
	return (
		<ModelCard
			branded
			title="You're invisible!"
			titleProps={{ className: "desktop:text-3xl" }}
		>
			<div className="flex flex-col gap-4">
				<p>
					You've checked out a lot of profiles so far! Before you continue,
					let's wrap up your account setup. Please confirm your email to make
					your profile visible to others and get back in action.
				</p>
				<div className="flex gap-4">
					<ButtonLink href={urls.confirmEmail()} size="sm">
						Confirm email
					</ButtonLink>
				</div>
			</div>
		</ModelCard>
	);
};
