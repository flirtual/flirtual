import type { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { Onboarding0Form } from "./form";

export const metadata: Metadata = {
	title: "Create account"
};

export default async function Onboarding0Page() {
	return (
		<ModelCard
			branded
			className="shrink-0 desktop:max-w-xl"
			title="Create account"
		>
			<Onboarding0Form />
		</ModelCard>
	);
}
