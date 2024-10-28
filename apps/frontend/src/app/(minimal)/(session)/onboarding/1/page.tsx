import { unstable_serialize } from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { Onboarding1Form } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "About me"
};

export default async function Onboarding1Page() {
	const [games, interests, genders, countries] = await Promise.all([
		Attribute.list("game"),
		Attribute.list("interest"),
		Attribute.list("gender"),
		Attribute.list("country")
	]);

	return (
		<ModelCard branded className="shrink-0 desktop:max-w-2xl" title="About me">
			<SWRConfig
				value={{
					fallback: {
						[unstable_serialize(attributeKey("game"))]: games,
						[unstable_serialize(attributeKey("gender"))]: genders,
						[unstable_serialize(attributeKey("interest"))]: interests,
						[unstable_serialize(attributeKey("country"))]: countries
					}
				}}
			>
				<Onboarding1Form />
			</SWRConfig>
		</ModelCard>
	);
}
