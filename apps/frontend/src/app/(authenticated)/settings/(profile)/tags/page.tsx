import { Metadata } from "next";

import { TagsForm } from "./form";

import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

export const metadata: Metadata = {
	title: "Info & tags"
};

export default async function SettingsProfileTagsPage() {
	const games = await withAttributeList("game");
	const interests = await withAttributeList("interest");
	const platforms = await withAttributeList("platform");
	const sexualities = await withAttributeList("sexuality");
	const genders = await withAttributeList("gender");

	return (
		<ModelCard className="sm:max-w-2xl" title="Info & tags">
			<TagsForm {...{ games, genders, interests, platforms, sexualities }} />
		</ModelCard>
	);
}
