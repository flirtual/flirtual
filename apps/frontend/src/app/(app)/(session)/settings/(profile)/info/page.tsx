import * as swr from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";

import { InfoForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Basic info"
};

export default async function SettingsProfileInfoPage() {
	const [games, platforms, sexualities, genders, languages, countries] =
		await Promise.all([
			Attribute.list("game"),
			Attribute.list("platform"),
			Attribute.list("sexuality"),
			Attribute.list("gender"),
			Attribute.list("language"),
			Attribute.list("country")
		]);

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			title="Basic info"
		>
			<SWRConfig
				value={{
					fallback: {
						[swr.unstable_serialize(["attribute", "game"])]: games,
						[swr.unstable_serialize(["attribute", "platform"])]: platforms,
						[swr.unstable_serialize(["attribute", "sexuality"])]: sexualities,
						[swr.unstable_serialize(["attribute", "gender"])]: genders,
						[swr.unstable_serialize(["attribute", "language"])]: languages,
						[swr.unstable_serialize(["attribute", "country"])]: countries
					}
				}}
			>
				<InfoForm />
			</SWRConfig>
		</ModelCard>
	);
}
