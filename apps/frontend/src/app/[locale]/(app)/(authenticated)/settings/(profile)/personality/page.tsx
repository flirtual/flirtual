import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import { getSession } from "~/hooks/use-session";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";
import { personalityFetcher, personalityKey, queryClient } from "~/query";

import type { Route } from "./+types/page";
import { PersonalityForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("personality") }) }
	]);
};

export async function clientLoader() {
	const session = await getSession();
	if (!session) return;

	await queryClient.prefetchQuery({ queryKey: personalityKey(session.user.id), queryFn: personalityFetcher });
}

export default function SettingsProfilePersonalityPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("personality")}
		>
			<PersonalityForm />
		</ModelCard>
	);
}
