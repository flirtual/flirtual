import type { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { PrivacyForm } from "./form";

export const metadata: Metadata = {
	title: "Privacy"
};

export default function SettingsAccountPrivacyPage() {
	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title="Privacy"
		>
			<PrivacyForm />
		</ModelCard>
	);
}
