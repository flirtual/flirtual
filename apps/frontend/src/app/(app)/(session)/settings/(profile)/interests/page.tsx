import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { InterestsForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Interests"
};

export default async function SettingsProfileInterestsPage() {
	const interests = await withAttributeList("interest");

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			title="Interests"
		>
			<InterestsForm interests={interests} />
		</ModelCard>
	);
}
