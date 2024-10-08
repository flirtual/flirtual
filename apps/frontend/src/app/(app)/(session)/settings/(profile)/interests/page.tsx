import { unstable_serialize } from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/hooks/use-attribute";

import { InterestsForm } from "./form";

import type { Metadata } from "next";

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
