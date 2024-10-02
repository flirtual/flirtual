import * as swr from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";

import { MatchmakingForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Matchmaking"
};

export default async function SettingsProfileMatchmakingPage() {
	const genders = await Attribute.list("gender");

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title="Matchmaking"
		>
			<SWRConfig
				value={{
					fallback: {
						[swr.unstable_serialize(["attribute", "gender"])]: genders
					}
				}}
			>
				<MatchmakingForm />
			</SWRConfig>
		</ModelCard>
	);
}
