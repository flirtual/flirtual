import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";
import { getInternationalization } from "~/i18n";

import { Onboarding1Form } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "About me"
};

export default async function Onboarding1Page() {
	const [games, interests, genders, { country }] = await Promise.all([
		withAttributeList("game"),
		withAttributeList("interest"),
		withAttributeList("gender"),
		getInternationalization()
	]);

	return (
		<ModelCard className="shrink-0 desktop:max-w-2xl" title="About me">
			<Onboarding1Form
				{...{
					games,
					genders,
					interests,
					ipcountry: country
				}}
			/>
		</ModelCard>
	);
}
