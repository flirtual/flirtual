import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { ModelCard } from "~/components/model-card";

import { SubscriptionForm } from "./form";

// export async function generateMetadata(): Promise<Metadata> {
// 	const t = await getTranslations();
//
// 	return {
// 		title: t("premium")
// 	};
// }

export default function SubscriptionPage({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = use(params);
	setRequestLocale(locale);

	const t = useTranslations();

	return (
		<ModelCard
			className="desktop:max-w-3xl"
			containerProps={{ className: "gap-8" }}
			title={t("flirtual_premium")}
		>
			<SubscriptionForm />
		</ModelCard>
	);
}
