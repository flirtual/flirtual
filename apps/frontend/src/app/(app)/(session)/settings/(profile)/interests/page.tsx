import * as swr from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";

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
						[swr.unstable_serialize(["attribute", "interest"])]: interests,
						[swr.unstable_serialize(["attribute", "interest-category"])]:
							interestCategories
					}
				}}
			>
				<InterestsForm />
			</SWRConfig>
		</ModelCard>
	);
}
