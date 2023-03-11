import { Cog8ToothIcon } from "@heroicons/react/24/solid";

import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

export const OutOfProspects: React.FC = () => {
	return (
		<ModelCard title="Out of matches">
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-4">
					<p>
						To see more people, try expanding your{" "}
						<InlineLink className="underline" href={urls.settings.matchmaking(urls.browse())}>
							matchmaking filters
						</InlineLink>
						.
					</p>
					<p>
						Or check back later. Each week hundreds of new Flirtual profiles are created. Invite
						your friends to try Flirtual!
					</p>
					<p>
						You can also continue in Homie Mode, where you can meet new friends (without matchmaking
						filters).
					</p>
				</div>
				<div className="flex gap-8">
					<ButtonLink className="flex gap-4 px-8" href={urls.settings.matchmaking()}>
						<Cog8ToothIcon className="h-8 w-8" />
						<span>Configure</span>
					</ButtonLink>
				</div>
			</div>
		</ModelCard>
	);
};
