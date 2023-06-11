import { Metadata } from "next";

import { BiographyForm } from "./form";

import { ModelCard } from "~/components/model-card";

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
