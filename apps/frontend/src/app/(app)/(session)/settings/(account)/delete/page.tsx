import type { Metadata } from "next";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { DeleteForm } from "./form";

export const metadata: Metadata = {
	title: "Delete account"
};

export default async function SettingsAccountDeactivatePage() {
	const deleteReasons = await Attribute.list("delete-reason");

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title="Delete account"
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
