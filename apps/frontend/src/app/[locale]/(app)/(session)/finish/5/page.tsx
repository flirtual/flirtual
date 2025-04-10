import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";

import { FinishProgress } from "../progress";
import { Finish5Form } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("connections")
	};
}

export default async function Finish5Page({ searchParams }: {
	searchParams?: Promise<{
		error?: string;
	}>;
}) {
	const t = await getTranslations();
	const { error } = (await searchParams) || {};

	return (
		<>
			<FinishProgress page={5} />
			<ModelCard
				className="shrink-0 pb-[max(calc(var(--safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title={t("connections")}
			>
				<Finish5Form error={error} />
			</ModelCard>
		</>
	);
}
