import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Authentication } from "~/api/auth";
import { Personality } from "~/api/user/profile/personality";
import { ModelCard } from "~/components/model-card";

import { FinishProgress } from "../progress";
import { Finish4Form } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("personality")
	};
}

export default async function Finish4Page() {
	const t = await getTranslations();
	const { user } = await Authentication.getSession();
	const personality = await Personality.get(user.id);

	return (
		<>
			<FinishProgress page={4} />
			<ModelCard
				className="shrink-0 pb-[max(calc(var(--safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title={t("personality")}
			>
				<Finish4Form personality={personality} />
			</ModelCard>
		</>
	);
}
