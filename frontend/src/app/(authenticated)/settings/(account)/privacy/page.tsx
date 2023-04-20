import { ModelCard } from "~/components/model-card";

import { PrivacyForm } from "./form";

export default function SettingsAccountPrivacyPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Account Privacy">
			<PrivacyForm />
		</ModelCard>
	);
}
