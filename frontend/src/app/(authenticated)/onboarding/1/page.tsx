import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { Onboarding1Form } from "./form";

export default async function Onboarding1Page() {
	const genders = (await withAttributeList("gender"))
		.filter((gender) => gender.metadata?.simple)
		.sort((a, b) => ((a.metadata?.order ?? 0) > (b.metadata?.order ?? 0) ? 1 : -1));

	return (
		<ModelCard title="Matchmaking">
			<Onboarding1Form genders={genders} />
		</ModelCard>
	);
}
