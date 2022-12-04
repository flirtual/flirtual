"use client";

import { ModelCard } from "~/components/model-card";

import { PrivacyForm } from "./form";

export default function SettingsAccountPrivacyPage() {
	return (
		<ModelCard title="Account Privacy">
			<PrivacyForm />
		</ModelCard>
	);
}
