import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { Onboarding2Form } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("want_to_meet")
	};
}

export default async function Onboarding2Page() {
	const t = await getTranslations();
	const genders = await Attribute.list("gender");

	return (
		<ModelCard branded className="desktop:max-w-2xl" title={t("want_to_meet")}>
			<SWRConfig
				value={{
					fallback: {
						[unstable_serialize(attributeKey("gender"))]: genders
					}
				}}
			>
				<Onboarding2Form />
			</SWRConfig>
		</ModelCard>
	);
}
