import { ModelCard } from "~/components/model-card";
import { Authentication } from "~/api/auth";
import { Personality } from "~/api/user/profile/personality";

import { FinishProgress } from "../progress";

import { Finish4Form } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Personality"
};

export default async function Finish4Page() {
	const { user } = await Authentication.getSession();
	const personality = await Personality.get(user.id);

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
