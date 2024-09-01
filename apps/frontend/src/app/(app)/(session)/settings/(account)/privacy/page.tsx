import { ModelCard } from "~/components/model-card";

import { PrivacyForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Privacy"
};

export default function SettingsAccountPrivacyPage() {
	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			title="Privacy"
		>
			<PrivacyForm />
		</ModelCard>
	);
}
