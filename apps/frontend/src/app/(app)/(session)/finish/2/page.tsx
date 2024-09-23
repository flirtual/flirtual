import { ModelCard } from "~/components/model-card";

import { FinishProgress } from "../progress";

import { Finish2Form } from "./form";

import type { Metadata } from "next";

import { withAttributeList } from "~/api/attributes-server";

export const metadata: Metadata = {
	title: "More details"
};

export default async function Finish2Page() {
	const [platforms, sexualities] = await Promise.all([
		withAttributeList("platform"),
		withAttributeList("sexuality")
	]);

	return (
		<>
			<FinishProgress page={2} />
			<ModelCard
				className="shrink-0 pb-[max(calc(env(safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title="More details"
			>
				<Finish2Form
					{...{
						platforms,
						sexualities
					}}
				/>
			</ModelCard>
		</>
	);
}
