import { ModelCard } from "~/components/model-card";

import { NsfwForm } from "./form";

export default function SettingsProfileNsfwPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="NSFW">
			<NsfwForm />
		</ModelCard>
	);
}
