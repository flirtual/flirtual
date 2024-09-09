import * as swr from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";

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
			title="Delete account"
		>
			<SWRConfig
				value={{
					fallback: {
						[swr.unstable_serialize(["attributes", "delete-reason"])]:
							deleteReasons
					}
				}}
			>
				<DeleteForm />
			</SWRConfig>
		</ModelCard>
	);
}
