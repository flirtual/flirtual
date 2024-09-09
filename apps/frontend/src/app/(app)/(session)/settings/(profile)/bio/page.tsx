import * as swr from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";

import { BiographyForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Bio & pics"
};

export default async function SettingsProfileBiographyPage() {
	const prompts = await Attribute.list("prompt");

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			title="Bio & pics"
		>
			<SWRConfig
				value={{
					fallback: {
						[swr.unstable_serialize(["attribute", "prompt"])]: prompts
					}
				}}
			>
				<BiographyForm />
			</SWRConfig>
		</ModelCard>
	);
}
