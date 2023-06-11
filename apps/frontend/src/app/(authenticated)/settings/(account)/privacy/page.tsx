import { PrivacyForm } from "./form";

import { ModelCard } from "~/components/model-card";

export default function SettingsAccountPrivacyPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Account Privacy">
			<PrivacyForm />
		</ModelCard>
	);
}
