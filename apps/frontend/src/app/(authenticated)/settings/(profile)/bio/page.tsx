import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { BiographyForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Bio & pics"
};

export default async function SettingsProfileBiographyPage() {
	const games = await withAttributeList("game");

	return (
		<ModelCard
			className="desktop:w-[42rem] desktop:max-w-full"
			title="Bio & pics"
		>
			<BiographyForm games={games} />
		</ModelCard>
	);
}
