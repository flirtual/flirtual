import { ModelCard } from "~/components/model-card";
import { thruServerCookies, withSession } from "~/server-utilities";
import { api } from "~/api";

import { FinishProgress } from "../progress";

import { Finish4Form } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Personality"
};

export default async function Finish4Page() {
	const session = await withSession();
	const personality = await api.user.profile.getPersonality(
		session.user.id,
		thruServerCookies()
	);

	return (
		<>
			<FinishProgress page={4} />
			<ModelCard
				className="shrink-0 pb-[max(calc(env(safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title="Personality"
			>
				<Finish4Form personality={personality} />
			</ModelCard>
		</>
	);
}
