import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";

import { DebugInfo } from "./debug-info";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("debug_information")
	};
}

export default async function DebuggerPage() {
	const t = await getTranslations();

	return (
		<ModelCard
			className="h-full desktop:h-fit"
			containerProps={{ className: "gap-4" }}
			title={t("debug_information")}
		>
			<DebugInfo />
		</ModelCard>
	);
}
