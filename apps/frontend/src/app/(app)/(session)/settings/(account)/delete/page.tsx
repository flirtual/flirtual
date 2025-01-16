import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { DeleteForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("delete_account")
	};
}

export default async function SettingsAccountDeactivatePage() {
	const t = await getTranslations();
	const deleteReasons = await Attribute.list("delete-reason");

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("delete_account")}
		>
			<SWRConfig
				value={{
					fallback: {
						[unstable_serialize(attributeKey("delete-reason"))]: deleteReasons
					}
				}}
			>
				<DeleteForm />
			</SWRConfig>
		</ModelCard>
	);
}
