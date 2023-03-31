import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

export const OutOfProspects: React.FC = () => {
	return (
		<ModelCard title="Come back tomorrow!" titleProps={{ className: "md:text-3xl" }}>
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-4">
					<p>You are out of profiles for today :(</p>
					<p>
						You can <InlineLink href={urls.subscription}>upgrade to Premium</InlineLink> to{" "}
						<em>browse unlimited profiles</em> and <em>see who&apos;s already liked you</em>.
					</p>
					<p>
						You can also continue in <InlineLink href="/homies">Homie Mode</InlineLink>, where you
						can meet new friends (without matchmaking filters).
					</p>
				</div>
				<div className="flex gap-4">
					<ButtonLink href={urls.browse("friend")} size="sm">
						Homie Mode
					</ButtonLink>
					<ButtonLink href={urls.subscription} size="sm">
						Premium
					</ButtonLink>
				</div>
			</div>
		</ModelCard>
	);
};
