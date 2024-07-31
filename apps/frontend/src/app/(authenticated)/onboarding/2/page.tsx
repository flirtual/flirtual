import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { Onboarding1Form } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Who I'm looking for"
};

export default async function Onboarding1Page() {
	const genders = (await withAttributeList("gender")).filter(
		({ metadata }) => metadata.simple || metadata.fallback
	);

	return (
		<ModelCard className="desktop:max-w-2xl" title="I want to meet...">
			<Onboarding1Form genders={genders} />
		</ModelCard>
	);
}
