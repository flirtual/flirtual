import { ModelCard } from "~/components/model-card";

import { AppearanceForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Appearance"
};

export default function SettingsAccountAppearancePage() {
	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title="Appearance"
		>
			<AppearanceForm />
		</ModelCard>
	);
}
