import type { Metadata } from "next";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { BiographyForm } from "./form";

export const metadata: Metadata = {
	title: "Bio & pics"
};

export default async function SettingsProfileBiographyPage() {
	const prompts = await Attribute.list("prompt");

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title="Bio & pics"
		>
			<SWRConfig
				value={{
					fallback: {
						[unstable_serialize(attributeKey("prompt"))]: prompts
					}
				}}
			>
				<BiographyForm />
			</SWRConfig>
		</ModelCard>
	);
}
