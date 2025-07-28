import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";

import type { Route } from "./+types/page";
import { SubscriptionForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([...rootMeta(options), { title: t("premium") }]);
};

export default function SubscriptionPage() {
	const { t } = useTranslation();

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
