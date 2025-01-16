import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { MatchmakingForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("matchmaking")
	};
}

export default async function SettingsProfileMatchmakingPage() {
	const t = await getTranslations();
	const genders = await Attribute.list("gender");

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("matchmaking")}
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
