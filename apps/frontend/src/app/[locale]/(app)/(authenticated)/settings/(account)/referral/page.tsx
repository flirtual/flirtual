import { ModelCard } from "~/components/model-card";
import { metaMerge, rootMeta } from "~/root";

import type { Route } from "./+types/page";
import { ReferralForm } from "./form";
import { ReferralTicket } from "./referral-ticket";

export const meta: Route.MetaFunction = (options) => {
	return metaMerge([
		...rootMeta(options),
		{ title: "Refer a homie" }
	]);
};

export default function SettingsAccountReferralPage() {
	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title="Refer a homie"
		>
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-4">
					<span>
						Share the love! Invite a friend to Flirtual and you&apos;ll both get
						??? when they sign up.
					</span>
					<ReferralTicket code="ABCD1234" />
					<span>
						They&apos;ll have 7 days after they sign up to enter your referral
						code here in the Settings.
					</span>
				</div>
				<ReferralForm />
			</div>
		</ModelCard>
	);
}
