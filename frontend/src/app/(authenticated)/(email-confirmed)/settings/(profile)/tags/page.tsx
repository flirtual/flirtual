import { ModelCard } from "~/components/model-card";

import { TagsForm } from "./form";

export default function SettingsProfileTagsPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Information & tags">
			<TagsForm />
		</ModelCard>
	);
}
