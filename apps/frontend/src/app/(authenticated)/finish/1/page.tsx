import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { FinishProgress } from "../progress";

import { Finish1Form } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Bio & pics"
};

export default async function Finish1Page() {
	const games = await withAttributeList("game");

	return (
		<>
			<FinishProgress page={1} />
			<ModelCard
				className="shrink-0 pb-[max(calc(env(safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title="Bio & pics"
			>
				<Finish1Form games={games} />
			</ModelCard>
		</>
	);
}
