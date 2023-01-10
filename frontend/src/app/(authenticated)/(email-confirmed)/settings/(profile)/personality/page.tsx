import { ModelCard } from "~/components/model-card";

import { PersonalityForm } from "./form";

export const config = { runtime: "experimental-edge" };

export default function SettingsProfilePersonalityPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Personality">
			<PersonalityForm />
		</ModelCard>
	);
}
