import type { Metadata } from "next";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { NsfwForm } from "./form";

export const metadata: Metadata = {
	title: "NSFW"
};

export default async function SettingsProfileNsfwPage() {
	const kinks = await Attribute.list("kink");

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title="NSFW"
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
