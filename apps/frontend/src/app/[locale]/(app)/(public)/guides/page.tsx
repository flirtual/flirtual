
import { useTranslation } from "react-i18next";

import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("guides")
	};
}

export default function GuidesPage() {
	const { t } = useTranslation();

	return (
		<ModelCard className="w-full desktop:max-w-2xl" title={t("guides")}>
			<ul className="list-disc text-xl">
				<li>
					<InlineLink href={urls.guides.mentalHealth}>
						{t("mental_health_resources")}
					</InlineLink>
				</li>
			</ul>
		</ModelCard>
	);
}
