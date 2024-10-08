import { unstable_serialize } from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/hooks/use-attribute";

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
			inset={false}
			title="Basic info"
		>
			<SWRConfig
				value={{
					fallback: {
						[unstable_serialize(attributeKey("game"))]: games,
						[unstable_serialize(attributeKey("platform"))]: platforms,
						[unstable_serialize(attributeKey("sexuality"))]: sexualities,
						[unstable_serialize(attributeKey("gender"))]: genders,
						[unstable_serialize(attributeKey("language"))]: languages,
						[unstable_serialize(attributeKey("country"))]: countries
					}
				}}
			>
				<InfoForm />
			</SWRConfig>
		</ModelCard>
	);
}
