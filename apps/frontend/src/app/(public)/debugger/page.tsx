import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";

import { DebugInfo } from "./debug-info";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("debugger");

	return {
		title: t("title")
	};
}

export default function DebuggerPage() {
	const t = useTranslations("debugger");

	return (
		<SoleModelLayout>
			<ModelCard
				className="h-full desktop:h-fit"
				containerProps={{ className: "gap-4" }}
				title={t("title")}
			>
				<DebugInfo />
			</ModelCard>
		</SoleModelLayout>
	);
}
