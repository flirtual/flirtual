import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { AppearanceForm } from "./form";

export const metadata: Metadata = {
	title: "Appearance"
};

export default function SettingsAccountAppearancePage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Appearance">
			<AppearanceForm />
		</ModelCard>
	);
}
