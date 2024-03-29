import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { NsfwForm } from "./form";

export const metadata: Metadata = {
	title: "NSFW"
};

export default async function SettingsProfileNsfwPage() {
	const kinks = await withAttributeList("kink");

	return (
		<ModelCard className="sm:max-w-2xl" title="NSFW">
			<NsfwForm kinks={kinks} />
		</ModelCard>
	);
}
