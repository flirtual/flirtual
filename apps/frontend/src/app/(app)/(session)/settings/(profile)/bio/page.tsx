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
			className="shrink desktop:w-full desktop:max-w-2xl"
			title="Bio & pics"
		>
			<BiographyForm games={games} />
		</ModelCard>
	);
}
