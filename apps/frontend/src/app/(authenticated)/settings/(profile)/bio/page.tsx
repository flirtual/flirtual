import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { BiographyForm } from "./form";

export const metadata: Metadata = {
	title: "Bio & pics"
};

export default async function SettingsProfileBiographyPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Bio & pics">
			<BiographyForm />
		</ModelCard>
	);
}
