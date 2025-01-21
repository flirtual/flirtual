import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { InfoForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("basic_info")
	};
}

export default async function SettingsProfileInfoPage() {
	const t = await getTranslations();

	const [games, platforms, sexualities, genders, languages, countries]
		= await Promise.all([
			Attribute.list("game"),
			Attribute.list("platform"),
			Attribute.list("sexuality"),
			Attribute.list("gender"),
			Attribute.list("language"),
			Attribute.list("country")
		]);

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("basic_info")}
		>
			<SWRConfig
				value={{
					fallback: {
						[unstable_serialize(attributeKey("game"))]: games,
						[unstable_serialize(attributeKey("platform"))]: platforms,
						[unstable_serialize(attributeKey("sexuality"))]: sexualities,
						[unstable_serialize(attributeKey("gender"))]: genders,
						[unstable_serialize(attributeKey("language"))]: languages,
						[unstable_serialize(attributeKey("country"))]: countries
					}
				}}
			>
				<InfoForm />
			</SWRConfig>
		</ModelCard>
	);
}
