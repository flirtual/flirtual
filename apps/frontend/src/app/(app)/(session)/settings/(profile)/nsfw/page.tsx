import * as swr from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";

import { NsfwForm } from "./form";

import type { Metadata } from "next";

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
						[swr.unstable_serialize(["attribute", "kink"])]: kinks
					}
				}}
			>
				<NsfwForm />
			</SWRConfig>
		</ModelCard>
	);
}
