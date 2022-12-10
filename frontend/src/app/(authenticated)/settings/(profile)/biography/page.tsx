import { ModelCard } from "~/components/model-card";

import { BiographyForm } from "./form";

export const config = { runtime: "experimental-edge" };

export default function SettingsProfileBiographyPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Biography & pictures">
			<BiographyForm />
		</ModelCard>
	);
}
