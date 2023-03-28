import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";

export default function AboutPage() {
	return (
		<SoleModelLayout>
			<ModelCard className="w-full sm:max-w-2xl" title="VRChat invite">
				<div className="flex flex-col gap-8">
					<div className="flex flex-col gap-4">
						<p>If an event is happening now, this button will take you there!</p>
						<p>
							Start VRChat first and then click &quot;invite me&quot; on that page. You&apos;ll get
							an invite from yourself in-game.
						</p>
						<ButtonLink href="https://flirtu.al/invite">Join</ButtonLink>
					</div>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
