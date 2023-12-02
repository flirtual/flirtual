import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { PrivacyForm } from "./form";

export const metadata: Metadata = {
	title: "Privacy"
};

export default function SettingsAccountPrivacyPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Privacy">
			<PrivacyForm />
		</ModelCard>
	);
}
