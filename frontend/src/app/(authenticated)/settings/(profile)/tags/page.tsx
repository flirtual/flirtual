import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { TagsForm } from "./form";

export const metadata: Metadata = {
	title: "Information & tags"
};

export default async function SettingsProfileTagsPage() {
	const games = await withAttributeList("game");
	const interests = await withAttributeList("interest");
	const platforms = await withAttributeList("platform");
	const sexualities = await withAttributeList("sexuality");
	const genders = await withAttributeList("gender");

	return (
		<ModelCard className="sm:max-w-2xl" title="Information & tags">
			<TagsForm {...{ games, genders, interests, platforms, sexualities }} />
		</ModelCard>
	);
}
