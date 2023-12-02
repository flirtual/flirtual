import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { Onboarding2Form } from "./form";

export const metadata: Metadata = {
	title: "Info & tags"
};

export default async function Onboarding2Page() {
	const games = await withAttributeList("game");
	const interests = await withAttributeList("interest");
	const platforms = await withAttributeList("platform");
	const sexualities = await withAttributeList("sexuality");
	const genders = await withAttributeList("gender");

	return (
		<ModelCard className="shrink-0 sm:max-w-2xl" title="Info & tags">
			<Onboarding2Form
				{...{
					games,
					genders,
					interests,
					platforms,
					sexualities
				}}
			/>
		</ModelCard>
	);
}
