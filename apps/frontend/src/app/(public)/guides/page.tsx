import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

import { InlineLink } from "~/components/inline-link";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("guides");

	return {
		title: t("title")
	};
}

export default function GuidesPage() {
	const t = useTranslations("guides");

	return (
		<SoleModelLayout>
			<ModelCard className="w-full desktop:max-w-2xl" title={t("title")}>
				<ul className="list-disc text-xl">
					<li>
						<InlineLink href={urls.guides.mentalHealth}>
							{t("ago_patchy_chipmunk_find")}
						</InlineLink>
					</li>
				</ul>
			</ModelCard>
		</SoleModelLayout>
	);
}
