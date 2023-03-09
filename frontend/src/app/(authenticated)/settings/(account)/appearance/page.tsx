import { ModelCard } from "~/components/model-card";

import { AppearanceForm } from "./form";

export default function SettingsAccountAppearancePage() {
	return (
		<ModelCard title="Appearance">
			<AppearanceForm />
		</ModelCard>
	);
}
