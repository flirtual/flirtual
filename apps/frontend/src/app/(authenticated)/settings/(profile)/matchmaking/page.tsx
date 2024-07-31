import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { MatchmakingForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Matchmaking"
};

export default async function SettingsProfileMatchmakingPage() {
	const genders = (await withAttributeList("gender")).filter(
		({ metadata }) => metadata.simple || metadata.fallback
	);

	return (
		<ModelCard
			className="desktop:w-[42rem] desktop:max-w-full"
			title="Matchmaking"
		>
			<MatchmakingForm genders={genders} />
		</ModelCard>
	);
}
