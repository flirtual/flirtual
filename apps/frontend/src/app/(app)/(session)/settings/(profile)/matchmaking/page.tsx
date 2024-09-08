import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";

import { MatchmakingForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Matchmaking"
};

export default async function SettingsProfileMatchmakingPage() {
	const genders = (await Attribute.list("gender")).filter(
		({ metadata }) => metadata.simple || metadata.fallback
	);

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			title="Matchmaking"
		>
			<MatchmakingForm genders={genders} />
		</ModelCard>
	);
}
