import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { Onboarding1Form } from "./form";

export default async function Onboarding1Page() {
	const genders = (await withAttributeList("gender")).filter((gender) => gender.metadata?.simple);

	return (
		<ModelCard className="sm:max-w-2xl" title="Matchmaking">
			<Onboarding1Form genders={genders} />
		</ModelCard>
	);
}
