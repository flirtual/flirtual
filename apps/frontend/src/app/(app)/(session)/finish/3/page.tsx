import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";

import { FinishProgress } from "../progress";

import { Finish3Form } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Interests"
};

export default async function Finish3Page() {
	const interests = await Attribute.list("interest");

	return (
		<>
			<FinishProgress page={3} />
			<ModelCard
				className="shrink-0 pb-[max(calc(env(safe-area-inset-bottom,0rem)+4.5rem),6rem)] desktop:max-w-2xl desktop:pb-0"
				title="Interests"
			>
				<Finish3Form />
			</ModelCard>
		</>
	);
}
