import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { InfoForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Basic info"
};

export default async function SettingsProfileInfoPage() {
	const games = await withAttributeList("game");
	const platforms = await withAttributeList("platform");
	const sexualities = await withAttributeList("sexuality");
	const genders = await withAttributeList("gender");

	return (
		<ModelCard
			className="desktop:w-[42rem] desktop:max-w-full"
			title="Basic info"
		>
			<InfoForm {...{ games, genders, platforms, sexualities }} />
		</ModelCard>
	);
}
