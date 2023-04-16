import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { MatchmakingForm } from "./form";

export const metadata: Metadata = {
	title: "Matchmaking"
};

export default function SettingsProfileMatchmakingPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Matchmaking">
			<MatchmakingForm />
		</ModelCard>
	);
}
