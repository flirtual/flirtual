import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { ModelCard } from "~/components/model-card";

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
	const { locale } = use(params);
	setRequestLocale(locale);

	const t = useTranslations();

	return (
		<ModelCard branded miniFooter className="desktop:max-w-2xl" title={t("want_to_meet")}>
			<Onboarding2Form />
		</ModelCard>
	);
}
