import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import { getSession } from "~/hooks/use-session";
import { defaultLocale, i18n, redirect } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/page";
import { SubscriptionForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("premium") }) }
	]);
};

export async function clientLoader() {
	const session = await getSession();
	if (!session) return;

	const { user: { emailConfirmedAt } } = session;
	if (!emailConfirmedAt)
		return redirect(urls.confirmEmail({ to: urls.subscription.default }));
}

clientLoader.hydrate = true as const;

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
