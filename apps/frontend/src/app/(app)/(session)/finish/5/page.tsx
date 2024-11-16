import type { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { FinishProgress } from "../progress";
import { Finish5Form } from "./form";

export const metadata: Metadata = {
	title: "Connections"
};

export default async function Finish5Page({ searchParams }: {
	searchParams?: Promise<{
		error?: string;
	}>;
}) {
	const { error } = (await searchParams) || {};

	return (
		<>
			<FinishProgress page={5} />
			<ModelCard
				className="shrink-0 pb-[max(calc(env(safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title="Connections"
			>
				<Finish5Form error={error} />
			</ModelCard>
		</>
	);
}
