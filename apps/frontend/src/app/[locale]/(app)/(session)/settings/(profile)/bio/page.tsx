import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { BiographyForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("bio_pics")
	};
}

export default async function SettingsProfileBiographyPage() {
	const t = await getTranslations();
	const prompts = await Attribute.list("prompt");

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("bio_pics")}
		>
			<SWRConfig
				value={{
					fallback: {
						[unstable_serialize(attributeKey("prompt"))]: prompts
					}
				}}
			>
				<BiographyForm />
			</SWRConfig>
		</ModelCard>
	);
}
