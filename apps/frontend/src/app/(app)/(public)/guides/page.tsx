import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("guides");

	return {
		title: t("title")
	};
}

export default async function GuidesPage() {
	const t = await getTranslations("guides");

	return (
		<ModelCard className="w-full desktop:max-w-2xl" title={t("title")}>
			<ul className="list-disc text-xl">
				<li>
					<InlineLink href={urls.guides.mentalHealth}>
						{t("ago_patchy_chipmunk_find")}
					</InlineLink>
				</li>
			</ul>
		</ModelCard>
	);
}
