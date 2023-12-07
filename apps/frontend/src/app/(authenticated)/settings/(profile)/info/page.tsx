import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { InfoForm } from "./form";

export const metadata: Metadata = {
	title: "Basic info"
};

export default async function SettingsProfileInfoPage() {
	const games = await withAttributeList("game");
	const platforms = await withAttributeList("platform");
	const sexualities = await withAttributeList("sexuality");
	const genders = await withAttributeList("gender");

	return (
		<ModelCard className="sm:max-w-2xl" title="Basic info">
			<InfoForm {...{ games, genders, platforms, sexualities }} />
		</ModelCard>
	);
}
