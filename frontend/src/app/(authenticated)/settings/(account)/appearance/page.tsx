import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { AppearanceForm } from "./form";

export const metadata: Metadata = {
	title: "Appearance"
};

export default function SettingsAccountAppearancePage() {
	return (
		<ModelCard title="Appearance">
			<AppearanceForm />
		</ModelCard>
	);
}
