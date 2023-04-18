import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { Onboarding2Form } from "./form";

export default async function Onboarding2Page() {
	const games = await withAttributeList("game");
	const interests = await withAttributeList("interest");
	const platforms = await withAttributeList("platform");
	const sexualities = await withAttributeList("sexuality");
	const genders = (await withAttributeList("gender")).sort((a, b) =>
		(a.metadata?.order ?? 0) > (b.metadata?.order ?? 0) ? 1 : -1
	);

	return (
		<ModelCard className="shrink-0 sm:max-w-2xl" title="Info & tags">
			<Onboarding2Form {...{ games, genders, interests, platforms, sexualities }} />
		</ModelCard>
	);
}
