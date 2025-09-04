import ms from "ms.macro";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { ModelCard } from "~/components/model-card";
import { getSession } from "~/hooks/use-session";
import { i18n, redirect } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { invalidate, queryClient, sessionKey, userCountFetcher, userCountKey } from "~/query";
import { urls } from "~/urls";

import type { Route } from "./+types/page";
import { SubscriptionForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("premium") }) }
	]);
};

export const handle = {
	async preload() {
		await queryClient.prefetchQuery({
			queryKey: userCountKey(),
			queryFn: userCountFetcher
		});
	}
};

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
	const session = await getSession();
	if (!session) return;

	const { user: { emailConfirmedAt } } = session;
	if (!emailConfirmedAt)
		return redirect(urls.confirmEmail({ to: urls.subscription.default }));

	if (new URL(request.url).searchParams.get("success") === "true") {
		invalidate({ queryKey: sessionKey() });

		// We poll for up to 1 minute to see if the user's subscription status has updated.
		// This is to handle the case where the webhook from the payment processor
		// has not yet been processed by the time the user is redirected back.
		[
			ms("5s"),
			ms("15s"),
			ms("30s"),
			ms("1m"),
		].map((timeout) =>
			setTimeout(() => invalidate({ queryKey: sessionKey() }), timeout)
		);
	}

	await handle.preload();
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
