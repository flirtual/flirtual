import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";

import { DebugInfo } from "./debug-info";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("debugger");

	return {
		title: t("title")
	};
}

export default async function DebuggerPage() {
	const t = await getTranslations("debugger");

	return (
		<ModelCard
			className="h-full desktop:h-fit"
			containerProps={{ className: "gap-4" }}
			title={t("title")}
		>
			<DebugInfo />
		</ModelCard>
	);
}
