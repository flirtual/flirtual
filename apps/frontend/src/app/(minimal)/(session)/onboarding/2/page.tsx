import { unstable_serialize } from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { Onboarding2Form } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Who I'm looking for"
};

export default async function Onboarding2Page() {
	const genders = await Attribute.list("gender");

	return (
		<ModelCard branded className="desktop:max-w-2xl" title="I want to meet...">
			<SWRConfig
				value={{
					fallback: {
						[unstable_serialize(attributeKey("gender"))]: genders
					}
				}}
			>
				<Onboarding2Form />
			</SWRConfig>
		</ModelCard>
	);
}
