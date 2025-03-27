import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { FinishProgress } from "../progress";
import { Finish2Form } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("more_details")
	};
}

export default async function Finish2Page() {
	const t = await getTranslations();

	const [platforms, sexualities, languages] = await Promise.all([
		Attribute.list("platform"),
		Attribute.list("sexuality"),
		Attribute.list("language")
	]);

	return (
		<>
			<FinishProgress page={2} />
			<ModelCard
				className="shrink-0 pb-[max(calc(var(--safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title={t("more_details")}
			>
				<SWRConfig
					value={{
						fallback: {
							[unstable_serialize(attributeKey("platform"))]: platforms,
							[unstable_serialize(attributeKey("sexuality"))]: sexualities,
							[unstable_serialize(attributeKey("language"))]: languages
						}
					}}
				>
					<Finish2Form />
				</SWRConfig>
			</ModelCard>
		</>
	);
}
