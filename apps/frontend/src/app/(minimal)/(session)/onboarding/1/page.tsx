import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { Onboarding1Form } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("about_me")
	};
}

export default async function Onboarding1Page() {
	const t = await getTranslations();

	const [games, interests, genders, countries] = await Promise.all([
		Attribute.list("game"),
		Attribute.list("interest"),
		Attribute.list("gender"),
		Attribute.list("country")
	]);

	return (
		<ModelCard
			branded
			miniFooter
			className="shrink-0 desktop:max-w-2xl"
			title={t("about_me")}
		>
			<SWRConfig
				value={{
					fallback: {
						[unstable_serialize(attributeKey("game"))]: games,
						[unstable_serialize(attributeKey("gender"))]: genders,
						[unstable_serialize(attributeKey("interest"))]: interests,
						[unstable_serialize(attributeKey("country"))]: countries
					}
				}}
			>
				<Onboarding1Form />
			</SWRConfig>
		</ModelCard>
	);
}
