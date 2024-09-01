import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

import type { ProspectKind } from "~/api/matchmaking";

export interface OutOfProspectsProps {
	mode: ProspectKind;
}

export const OutOfProspects: React.FC<OutOfProspectsProps> = ({ mode }) => {
	return (
		<ModelCard
			title="You've seen everyone!"
			titleProps={{ className: "desktop:text-3xl" }}
		>
			<div className="flex flex-col gap-8">
				{mode === "love" ? (
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
								Or check back later. Each week hundreds of new Flirtual profiles
								are created. Invite your friends to try Flirtual!
							</p>
							<p>
								You can also continue in{" "}
								<InlineLink href={urls.browse("friend")}>Homie Mode</InlineLink>
								, where you can meet new friends (without matchmaking filters).
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
				)}
			</div>
		</ModelCard>
	);
};
