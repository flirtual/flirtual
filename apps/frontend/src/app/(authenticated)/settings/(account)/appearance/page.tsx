import { ModelCard } from "~/components/model-card";

import { AppearanceForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Appearance"
};

export default function SettingsAccountAppearancePage() {
	return (
		<ModelCard
			className="desktop:w-[42rem] desktop:max-w-full"
			title="Appearance"
		>
			<AppearanceForm />
		</ModelCard>
	);
}
