import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { NsfwForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "NSFW"
};

export default async function SettingsProfileNsfwPage() {
	const kinks = await withAttributeList("kink");

	return (
		<ModelCard className="desktop:w-[42rem] desktop:max-w-full" title="NSFW">
			<NsfwForm kinks={kinks} />
		</ModelCard>
	);
}
