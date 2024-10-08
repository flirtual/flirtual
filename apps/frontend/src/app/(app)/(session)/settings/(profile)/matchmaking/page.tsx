import { unstable_serialize } from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/hooks/use-attribute";

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
						[unstable_serialize(attributeKey("gender"))]: genders
					}
				}}
			>
				<MatchmakingForm />
			</SWRConfig>
		</ModelCard>
	);
}
