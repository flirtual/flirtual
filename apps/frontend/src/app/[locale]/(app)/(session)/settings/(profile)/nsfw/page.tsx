import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { NsfwForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("nsfw")
	};
}

export default async function SettingsProfileNsfwPage() {
	const t = await getTranslations();
	const kinks = await Attribute.list("kink");

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("nsfw")}
		>
			<SWRConfig
				value={{
					fallback: {
						[unstable_serialize(attributeKey("kink"))]: kinks
					}
				}}
			>
				<NsfwForm />
			</SWRConfig>
		</ModelCard>
	);
}
