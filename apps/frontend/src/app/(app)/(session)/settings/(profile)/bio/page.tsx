import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";

import { BiographyForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Bio & pics"
};

export default async function SettingsProfileBiographyPage() {
	const games = await Attribute.list("game");

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			title="Bio & pics"
		>
			<BiographyForm games={games} />
		</ModelCard>
	);
}
