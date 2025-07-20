
import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import type { Locale } from "~/i18n";

import { Onboarding2Form } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("want_to_meet")
	};
}

export default function Onboarding2Page({ params }: {
	params: Promise<{ locale: Locale }>;
}) {
	const { t } = useTranslation();

	return (
		<ModelCard branded miniFooter className="desktop:max-w-2xl" title={t("want_to_meet")}>
			<Onboarding2Form />
		</ModelCard>
	);
}
