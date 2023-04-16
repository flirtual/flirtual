import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { PersonalityForm } from "./form";

export const metadata: Metadata = {
	title: "Personality"
};

export default function SettingsProfilePersonalityPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Personality">
			<PersonalityForm />
		</ModelCard>
	);
}
