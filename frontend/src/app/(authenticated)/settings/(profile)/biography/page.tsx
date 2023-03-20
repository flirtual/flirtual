import { ModelCard } from "~/components/model-card";

import { BiographyForm } from "./form";

export default function SettingsProfileBiographyPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Biography & pictures">
			<BiographyForm />
		</ModelCard>
	);
}
