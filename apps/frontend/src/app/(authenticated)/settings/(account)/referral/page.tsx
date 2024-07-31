import { ModelCard } from "~/components/model-card";

import { ReferralTicket } from "./referral-ticket";
import { ReferralForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Refer a homie"
};

export default function SettingsAccountReferralPage() {
	return (
		<ModelCard
			className="desktop:w-[42rem] desktop:max-w-full"
			title="Refer a homie"
		>
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-4">
					<span className="select-none">
						Share the love! Invite a friend to Flirtual and you&apos;ll both get
						??? when they sign up.
					</span>
					<ReferralTicket code="ABCD1234" />
					<span className="select-none">
						They&apos;ll have 7 days after they sign up to enter your referral
						code here in the Settings.
					</span>
				</div>
				<ReferralForm />
			</div>
		</ModelCard>
	);
}
