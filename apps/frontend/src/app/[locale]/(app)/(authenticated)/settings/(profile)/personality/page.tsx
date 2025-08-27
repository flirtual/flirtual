import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { ModelCard } from "~/components/model-card";
import { getSession } from "~/hooks/use-session";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { personalityFetcher, personalityKey, queryClient } from "~/query";

import type { Route } from "./+types/page";
import { PersonalityForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("personality") }) }
	]);
};

export const handle = {
	async preload() {
		const session = await getSession();
		if (!session) return;

		await queryClient.prefetchQuery({ queryKey: personalityKey(session.user.id), queryFn: personalityFetcher });
	}
};

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
