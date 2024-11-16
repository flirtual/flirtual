import type { Metadata } from "next";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { InterestsForm } from "./form";

export const metadata: Metadata = {
	title: "Interests"
};

export default async function SettingsProfileInterestsPage() {
	const [interests, interestCategories] = await Promise.all([
		Attribute.list("interest"),
		Attribute.list("interest-category")
	]);

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title="Interests"
		>
			<SWRConfig
				value={{
					fallback: {
						[unstable_serialize(attributeKey("interest"))]: interests,
						[unstable_serialize(attributeKey("interest-category"))]:
							interestCategories
					}
				}}
			>
				<InterestsForm />
			</SWRConfig>
		</ModelCard>
	);
}
