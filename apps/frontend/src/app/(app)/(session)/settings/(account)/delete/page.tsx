import { unstable_serialize } from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/hooks/use-attribute";

import { DeleteForm } from "./form";

import type { Metadata } from "next";

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
