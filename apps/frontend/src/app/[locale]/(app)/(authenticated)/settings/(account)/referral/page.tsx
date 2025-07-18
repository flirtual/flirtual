import type { Metadata } from "next";
import type { Locale } from "~/i18n";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { ModelCard } from "~/components/model-card";

import { ReferralForm } from "./form";
import { ReferralTicket } from "./referral-ticket";

export const metadata: Metadata = {
	title: "Refer a homie"
};

export default function SettingsAccountReferralPage() {
	const { locale } = use(params);
	setRequestLocale(locale);

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
