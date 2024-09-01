import { ModelCard } from "~/components/model-card";

import { FinishProgress } from "../progress";

import { Finish5Form } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Connections"
};

export default function Finish5Page(props: {
	searchParams?: {
		error?: string;
	};
}) {
	const error = props.searchParams?.error;
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
